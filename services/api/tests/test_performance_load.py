"""
Real Performance and Load Tests
Tests actual system performance under various load conditions
"""

import time
import asyncio
import concurrent.futures
import statistics
from datetime import datetime, timedelta
import pytest
from django.test import TransactionTestCase
from django.db import connection
from django.core.cache import cache
from rest_framework.test import APIClient

from core.models import Organization, Submission, Answer
from forms.models import Form
from webhooks.models import Webhook, Delivery


class DatabasePerformanceTests(TransactionTestCase):
    """Test database performance and query optimization"""
    
    def setUp(self):
        self.org = Organization.objects.create(
            name='Perf Test Org',
            slug='perf-test'
        )
        
        # Create test form with complex schema
        self.form = Form.objects.create(
            organization=self.org,
            title='Performance Test Form',
            schema={
                'fields': [
                    {'id': f'field_{i}', 'type': 'text'}
                    for i in range(50)  # 50 fields
                ]
            }
        )
    
    def test_bulk_submission_insert_performance(self):
        """Test performance of bulk submission inserts"""
        submission_count = 1000
        start_time = time.time()
        
        # Bulk create submissions
        submissions = []
        for i in range(submission_count):
            submissions.append(Submission(
                form=self.form,
                respondent_key=f'perf-test-{i}',
                metadata={'index': i}
            ))
        
        Submission.objects.bulk_create(submissions)
        
        # Bulk create answers
        answers = []
        for submission in Submission.objects.filter(form=self.form):
            for field_num in range(10):  # 10 answers per submission
                answers.append(Answer(
                    submission=submission,
                    block_id=f'field_{field_num}',
                    type='text',
                    value={'text': f'Answer {field_num}'}
                ))
        
        Answer.objects.bulk_create(answers, batch_size=1000)
        
        end_time = time.time()
        duration = end_time - start_time
        
        print(f"Bulk insert of {submission_count} submissions: {duration:.2f}s")
        print(f"Rate: {submission_count/duration:.1f} submissions/second")
        
        # Performance assertions
        self.assertLess(duration, 10.0)  # Should complete in under 10 seconds
        self.assertGreater(submission_count/duration, 100)  # At least 100/s
    
    def test_submission_query_performance(self):
        """Test query performance for common operations"""
        # Create test data
        self._create_test_submissions(5000)
        
        # Test 1: Filter by date range
        start_time = time.time()
        recent_submissions = Submission.objects.filter(
            form=self.form,
            created_at__gte=datetime.now() - timedelta(days=7)
        ).select_related('form').prefetch_related('answers')[:100]
        
        list(recent_submissions)  # Force evaluation
        query_time = time.time() - start_time
        
        print(f"Date range query: {query_time*1000:.2f}ms")
        self.assertLess(query_time, 0.1)  # Under 100ms
        
        # Test 2: Search submissions
        start_time = time.time()
        search_results = Answer.objects.filter(
            submission__form=self.form,
            value__text__icontains='test'
        ).select_related('submission').distinct('submission')[:50]
        
        list(search_results)
        search_time = time.time() - start_time
        
        print(f"Search query: {search_time*1000:.2f}ms")
        self.assertLess(search_time, 0.2)  # Under 200ms
        
        # Test 3: Aggregation query
        start_time = time.time()
        from django.db.models import Count, Avg
        stats = Submission.objects.filter(
            form=self.form
        ).aggregate(
            total=Count('id'),
            avg_answers=Avg('answers__id')
        )
        
        agg_time = time.time() - start_time
        print(f"Aggregation query: {agg_time*1000:.2f}ms")
        self.assertLess(agg_time, 0.05)  # Under 50ms
    
    def test_n_plus_one_detection(self):
        """Test for N+1 query problems"""
        self._create_test_submissions(100)
        
        with self.assertNumQueries(3):  # Should be constant regardless of submissions
            # This should use select_related and prefetch_related properly
            submissions = Submission.objects.filter(
                form=self.form
            ).select_related(
                'form__organization'
            ).prefetch_related(
                'answers',
                'webhookdelivery_set__webhook'
            )[:50]
            
            # Force evaluation
            for submission in submissions:
                _ = submission.form.organization.name
                _ = list(submission.answers.all())
                _ = list(submission.webhookdelivery_set.all())
    
    def test_index_effectiveness(self):
        """Test that database indexes are being used effectively"""
        self._create_test_submissions(10000)
        
        # Check query execution plans
        with connection.cursor() as cursor:
            # Test index on created_at
            cursor.execute(
                "EXPLAIN ANALYZE SELECT * FROM core_submission "
                "WHERE form_id = %s AND created_at > %s",
                [self.form.id, datetime.now() - timedelta(days=1)]
            )
            plan = cursor.fetchall()
            
            # Should use index scan, not sequential scan
            plan_text = str(plan)
            self.assertIn('Index Scan', plan_text)
            self.assertNotIn('Seq Scan on core_submission', plan_text)
            
            # Test composite index
            cursor.execute(
                "EXPLAIN ANALYZE SELECT * FROM core_answer "
                "WHERE submission_id = %s AND block_id = %s",
                [1, 'field_1']
            )
            plan = cursor.fetchall()
            
            plan_text = str(plan)
            self.assertIn('Index Scan', plan_text)
    
    def _create_test_submissions(self, count):
        """Helper to create test submissions"""
        submissions = []
        for i in range(count):
            submissions.append(Submission(
                form=self.form,
                respondent_key=f'test-{i}',
                created_at=datetime.now() - timedelta(
                    days=i % 30,
                    hours=i % 24
                )
            ))
        
        Submission.objects.bulk_create(submissions)
        
        # Create some answers
        answers = []
        for submission in Submission.objects.filter(form=self.form)[:count//10]:
            answers.append(Answer(
                submission=submission,
                block_id='field_1',
                type='text',
                value={'text': f'Test answer {submission.id}'}
            ))
        
        Answer.objects.bulk_create(answers)


class APILoadTests(TransactionTestCase):
    """Test API performance under load"""
    
    def setUp(self):
        self.form = Form.objects.create(
            organization=Organization.objects.create(
                name='Load Test',
                slug='load-test'
            ),
            title='Load Test Form',
            schema={
                'fields': [
                    {'id': 'email', 'type': 'email'},
                    {'id': 'name', 'type': 'text'}
                ]
            }
        )
    
    def test_concurrent_submission_handling(self):
        """Test handling concurrent submissions"""
        concurrent_users = 50
        submissions_per_user = 10
        
        def submit_forms(user_id):
            client = APIClient()
            times = []
            
            for i in range(submissions_per_user):
                start = time.time()
                response = client.post(
                    f'/api/v1/forms/{self.form.id}/submissions/',
                    {
                        'answers': {
                            'email': f'user{user_id}_{i}@example.com',
                            'name': f'User {user_id}'
                        }
                    }
                )
                duration = time.time() - start
                times.append(duration)
                
                if response.status_code != 201:
                    print(f"Failed submission: {response.status_code}")
            
            return times
        
        # Run concurrent submissions
        start_time = time.time()
        
        with concurrent.futures.ThreadPoolExecutor(max_workers=concurrent_users) as executor:
            futures = [
                executor.submit(submit_forms, user_id)
                for user_id in range(concurrent_users)
            ]
            
            all_times = []
            for future in concurrent.futures.as_completed(futures):
                all_times.extend(future.result())
        
        total_duration = time.time() - start_time
        
        # Calculate statistics
        avg_response_time = statistics.mean(all_times)
        p95_response_time = statistics.quantiles(all_times, n=20)[18]  # 95th percentile
        p99_response_time = statistics.quantiles(all_times, n=100)[98]  # 99th percentile
        
        total_submissions = concurrent_users * submissions_per_user
        throughput = total_submissions / total_duration
        
        print(f"\nLoad Test Results:")
        print(f"Total submissions: {total_submissions}")
        print(f"Total duration: {total_duration:.2f}s")
        print(f"Throughput: {throughput:.1f} req/s")
        print(f"Avg response time: {avg_response_time*1000:.1f}ms")
        print(f"P95 response time: {p95_response_time*1000:.1f}ms")
        print(f"P99 response time: {p99_response_time*1000:.1f}ms")
        
        # Performance assertions
        self.assertLess(avg_response_time, 0.2)  # Avg under 200ms
        self.assertLess(p95_response_time, 0.5)  # P95 under 500ms
        self.assertLess(p99_response_time, 1.0)  # P99 under 1s
        self.assertGreater(throughput, 50)  # At least 50 req/s
    
    def test_api_rate_limiting_performance(self):
        """Test rate limiting doesn't significantly impact performance"""
        client = APIClient()
        
        # Measure baseline performance
        baseline_times = []
        for i in range(10):
            start = time.time()
            client.post(
                f'/api/v1/forms/{self.form.id}/submissions/',
                {'answers': {'email': f'test{i}@example.com'}}
            )
            baseline_times.append(time.time() - start)
            time.sleep(0.1)  # Stay under rate limit
        
        baseline_avg = statistics.mean(baseline_times)
        
        # Now hit rate limit and measure
        rate_limited_times = []
        for i in range(200):  # Exceed rate limit
            start = time.time()
            response = client.post(
                f'/api/v1/forms/{self.form.id}/submissions/',
                {'answers': {'email': f'rapid{i}@example.com'}}
            )
            duration = time.time() - start
            
            if response.status_code == 429:
                rate_limited_times.append(duration)
        
        if rate_limited_times:
            rate_limited_avg = statistics.mean(rate_limited_times)
            
            # Rate limiting should be fast (just a Redis check)
            print(f"Baseline avg: {baseline_avg*1000:.1f}ms")
            print(f"Rate limited avg: {rate_limited_avg*1000:.1f}ms")
            
            self.assertLess(rate_limited_avg, baseline_avg * 0.5)  # Should be faster


class CachePerformanceTests(TransactionTestCase):
    """Test caching layer performance"""
    
    def setUp(self):
        self.form = Form.objects.create(
            organization=Organization.objects.create(
                name='Cache Test',
                slug='cache-test'
            ),
            title='Cache Test Form'
        )
        cache.clear()
    
    def test_cache_hit_performance(self):
        """Test performance improvement from caching"""
        # Create test data
        for i in range(1000):
            Submission.objects.create(
                form=self.form,
                respondent_key=f'cache-test-{i}'
            )
        
        # Cold cache query
        start = time.time()
        from django.db.models import Count
        cold_result = Submission.objects.filter(
            form=self.form
        ).aggregate(total=Count('id'))
        cold_time = time.time() - start
        
        # Cache the result
        cache_key = f'form_stats_{self.form.id}'
        cache.set(cache_key, cold_result, 300)
        
        # Warm cache query
        start = time.time()
        warm_result = cache.get(cache_key)
        warm_time = time.time() - start
        
        print(f"Cold cache: {cold_time*1000:.2f}ms")
        print(f"Warm cache: {warm_time*1000:.2f}ms")
        print(f"Speedup: {cold_time/warm_time:.1f}x")
        
        # Cache should be significantly faster
        self.assertLess(warm_time, cold_time * 0.1)  # At least 10x faster
        self.assertLess(warm_time, 0.001)  # Under 1ms
    
    def test_cache_stampede_prevention(self):
        """Test cache stampede prevention under load"""
        cache_key = 'expensive_query'
        
        def expensive_operation():
            time.sleep(0.1)  # Simulate expensive query
            return {'result': 'data'}
        
        def get_or_compute():
            result = cache.get(cache_key)
            if result is None:
                # Use cache lock to prevent stampede
                lock_key = f'{cache_key}:lock'
                if cache.add(lock_key, '1', 10):  # 10 second lock
                    try:
                        result = expensive_operation()
                        cache.set(cache_key, result, 300)
                    finally:
                        cache.delete(lock_key)
                else:
                    # Another thread is computing, wait
                    for _ in range(50):
                        result = cache.get(cache_key)
                        if result is not None:
                            break
                        time.sleep(0.01)
            return result
        
        # Simulate concurrent requests
        start = time.time()
        with concurrent.futures.ThreadPoolExecutor(max_workers=20) as executor:
            futures = [executor.submit(get_or_compute) for _ in range(20)]
            results = [f.result() for f in futures]
        
        duration = time.time() - start
        
        # Should complete quickly (only one expensive operation)
        print(f"Stampede test duration: {duration:.2f}s")
        self.assertLess(duration, 0.3)  # Should be close to single operation time
        
        # All results should be the same
        self.assertEqual(len(set(str(r) for r in results)), 1)


class WebhookPerformanceTests(TransactionTestCase):
    """Test webhook delivery performance"""
    
    def setUp(self):
        self.org = Organization.objects.create(
            name='Webhook Test',
            slug='webhook-test'
        )
        
        self.webhooks = []
        for i in range(10):
            webhook = Webhook.objects.create(
                organization=self.org,
                url=f'https://example.com/webhook{i}',
                active=True
            )
            self.webhooks.append(webhook)
    
    def test_webhook_fan_out_performance(self):
        """Test performance of webhook fan-out to multiple endpoints"""
        submission = Submission.objects.create(
            form=Form.objects.create(
                organization=self.org,
                title='Test'
            )
        )
        
        # Measure fan-out time
        start = time.time()
        
        from webhooks.tasks import deliver_webhooks_for_submission
        deliver_webhooks_for_submission(submission.id)
        
        fan_out_time = time.time() - start
        
        # Check that deliveries were queued
        delivery_count = Delivery.objects.filter(
            submission=submission
        ).count()
        
        print(f"Fan-out to {len(self.webhooks)} webhooks: {fan_out_time*1000:.1f}ms")
        print(f"Per webhook: {fan_out_time/len(self.webhooks)*1000:.1f}ms")
        
        self.assertEqual(delivery_count, len(self.webhooks))
        self.assertLess(fan_out_time, 0.1)  # Under 100ms total
    
    def test_webhook_batch_processing(self):
        """Test batch processing of webhook deliveries"""
        # Create many pending deliveries
        deliveries = []
        for i in range(1000):
            delivery = Delivery(
                webhook=self.webhooks[i % len(self.webhooks)],
                submission_id=i,
                payload={'test': i},
                status='pending'
            )
            deliveries.append(delivery)
        
        Delivery.objects.bulk_create(deliveries)
        
        # Process batch
        start = time.time()
        
        from webhooks.tasks import process_pending_webhooks
        processed = process_pending_webhooks(batch_size=100)
        
        batch_time = time.time() - start
        
        print(f"Processed {processed} webhooks in {batch_time:.2f}s")
        print(f"Rate: {processed/batch_time:.1f} webhooks/second")
        
        # Should process efficiently
        self.assertGreater(processed/batch_time, 500)  # At least 500/s


class MemoryUsageTests(TransactionTestCase):
    """Test memory usage patterns"""
    
    def test_large_submission_memory_usage(self):
        """Test memory usage with large submissions"""
        import psutil
        import os
        
        process = psutil.Process(os.getpid())
        initial_memory = process.memory_info().rss / 1024 / 1024  # MB
        
        # Create large submission
        form = Form.objects.create(
            organization=Organization.objects.create(
                name='Memory Test',
                slug='memory-test'
            ),
            title='Memory Test'
        )
        
        submission = Submission.objects.create(form=form)
        
        # Create many answers
        answers = []
        for i in range(10000):
            answers.append(Answer(
                submission=submission,
                block_id=f'field_{i}',
                type='text',
                value={'text': 'x' * 1000}  # 1KB per answer
            ))
        
        Answer.objects.bulk_create(answers, batch_size=1000)
        
        # Load and process
        loaded_submission = Submission.objects.prefetch_related(
            'answers'
        ).get(id=submission.id)
        
        # Force evaluation
        answer_count = loaded_submission.answers.count()
        
        current_memory = process.memory_info().rss / 1024 / 1024
        memory_increase = current_memory - initial_memory
        
        print(f"Memory increase for {answer_count} answers: {memory_increase:.1f} MB")
        
        # Should not use excessive memory
        self.assertLess(memory_increase, 100)  # Less than 100MB increase
    
    def test_streaming_large_exports(self):
        """Test memory-efficient streaming of large exports"""
        # Create large dataset
        form = Form.objects.create(
            organization=Organization.objects.create(
                name='Export Test',
                slug='export-test'
            ),
            title='Export Test'
        )
        
        # Create many submissions
        for i in range(1000):
            submission = Submission.objects.create(
                form=form,
                respondent_key=f'export-{i}'
            )
            Answer.objects.create(
                submission=submission,
                block_id='data',
                type='text',
                value={'text': 'x' * 10000}  # 10KB per submission
            )
        
        # Test streaming export
        import psutil
        import os
        
        process = psutil.Process(os.getpid())
        initial_memory = process.memory_info().rss / 1024 / 1024
        
        # Simulate streaming export
        from django.http import StreamingHttpResponse
        
        def generate_csv():
            yield 'id,data\n'
            
            # Use iterator to avoid loading all in memory
            for submission in Submission.objects.filter(
                form=form
            ).iterator(chunk_size=100):
                answer = submission.answers.first()
                if answer:
                    yield f'{submission.id},{answer.value["text"][:100]}\n'
        
        response = StreamingHttpResponse(generate_csv(), content_type='text/csv')
        
        # Consume the stream
        content = b''.join(response.streaming_content)
        
        current_memory = process.memory_info().rss / 1024 / 1024
        memory_increase = current_memory - initial_memory
        
        print(f"Memory for streaming {len(content)/1024/1024:.1f}MB: {memory_increase:.1f}MB")
        
        # Should use minimal memory despite large export
        self.assertLess(memory_increase, 50)  # Less than 50MB for streaming


if __name__ == '__main__':
    pytest.main([__file__, '-v'])