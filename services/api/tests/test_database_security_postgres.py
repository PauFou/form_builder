"""
Database Security Tests
Tests SQL injection prevention, query safety, and data isolation
"""

import pytest
from django.test import TestCase, TransactionTestCase
from django.contrib.auth import get_user_model
from django.db import connection, transaction
from django.db.models import Q
from rest_framework.test import APIClient

from core.models import Organization, Submission, Answer
from forms.models import Form


User = get_user_model()


class SQLInjectionTests(TestCase):
    """Test SQL injection prevention"""
    
    def setUp(self):
        self.org = Organization.objects.create(
            name='Security Test Org',
            slug='security-test'
        )
        self.form = Form.objects.create(
            organization=self.org,
            title='Test Form'
        )
    
    def test_sql_injection_in_search(self):
        """Test SQL injection attempts in search queries"""
        # Create test data
        Submission.objects.create(
            form=self.form,
            respondent_key='test-user'
        )
        
        # SQL injection attempts
        malicious_queries = [
            "'; DROP TABLE core_submission; --",
            "' OR '1'='1",
            "'; DELETE FROM auth_user WHERE '1'='1'; --",
            "' UNION SELECT * FROM auth_user --",
            "'; UPDATE organizations SET plan='enterprise' WHERE '1'='1'; --",
        ]
        
        for query in malicious_queries:
            # Try injection via search
            results = Submission.objects.filter(
                Q(respondent_key__icontains=query) |
                Q(metadata__contains=query)
            )
            
            # Query should execute safely
            count = results.count()
            self.assertIsInstance(count, int)
            
            # Tables should still exist
            with connection.cursor() as cursor:
                cursor.execute(
                    "SELECT COUNT(*) FROM core_submission"
                )
                self.assertGreater(cursor.fetchone()[0], 0)
    
    def test_sql_injection_in_api_parameters(self):
        """Test SQL injection via API parameters"""
        client = APIClient()
        user = User.objects.create_user(
            username='test',
            password='test'
        )
        client.force_authenticate(user=user)
        
        # Injection attempts via various parameters
        injection_payloads = {
            'filter': "name'; DROP TABLE forms; --",
            'order': "created_at'; DELETE FROM submissions; --",
            'search': "' OR 1=1 UNION SELECT password FROM auth_user --",
            'fields': "id,title,'; INSERT INTO auth_user VALUES(); --",
        }
        
        for param, payload in injection_payloads.items():
            response = client.get(
                f'/api/v1/forms/',
                {param: payload}
            )
            
            # Request should not cause database errors
            self.assertIn(
                response.status_code,
                [200, 400, 403, 404]  # Valid response codes
            )
            
            # Verify tables still exist
            self.assertTrue(Form._meta.db_table in connection.introspection.table_names())
    
    def test_prepared_statement_usage(self):
        """Test that queries use prepared statements"""
        # Create submission with user input
        user_input = "Test'; DROP TABLE test; --"
        
        submission = Submission.objects.create(
            form=self.form,
            respondent_key=user_input
        )
        
        # Raw query with parameters (safe)
        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT * FROM core_submission WHERE respondent_key = %s",
                [user_input]
            )
            result = cursor.fetchone()
            self.assertIsNotNone(result)
        
        # Verify the input was stored safely
        retrieved = Submission.objects.get(id=submission.id)
        self.assertEqual(retrieved.respondent_key, user_input)
    
    def test_json_field_injection(self):
        """Test injection attempts in JSON fields"""
        malicious_json = {
            "field": "value'; DROP TABLE submissions; --",
            "nested": {
                "sql": "' OR '1'='1",
                "xss": "<script>alert('xss')</script>"
            }
        }
        
        submission = Submission.objects.create(
            form=self.form,
            metadata=malicious_json
        )
        
        # Query JSON fields safely
        results = Submission.objects.filter(
            metadata__field__icontains="DROP TABLE"
        )
        
        self.assertEqual(results.count(), 1)
        self.assertEqual(results.first().id, submission.id)
        
        # Verify data integrity
        retrieved = Submission.objects.get(id=submission.id)
        self.assertEqual(retrieved.metadata['field'], malicious_json['field'])


class DataIsolationTests(TransactionTestCase):
    """Test multi-tenant data isolation"""
    
    def setUp(self):
        # Create two organizations
        self.org1 = Organization.objects.create(
            name='Org 1',
            slug='org-1'
        )
        self.org2 = Organization.objects.create(
            name='Org 2',
            slug='org-2'
        )
        
        # Create users for each org
        self.user1 = User.objects.create_user(
            username='user1',
            password='pass1'
        )
        self.user1.memberships.create(
            organization=self.org1,
            role='admin'
        )
        
        self.user2 = User.objects.create_user(
            username='user2',
            password='pass2'
        )
        self.user2.memberships.create(
            organization=self.org2,
            role='admin'
        )
        
        # Create forms for each org
        self.form1 = Form.objects.create(
            organization=self.org1,
            title='Org 1 Form',
            created_by=self.user1
        )
        
        self.form2 = Form.objects.create(
            organization=self.org2,
            title='Org 2 Form',
            created_by=self.user2
        )
    
    def test_cross_organization_data_access(self):
        """Test that users cannot access other org's data"""
        client = APIClient()
        
        # User 1 tries to access Org 2's form
        client.force_authenticate(user=self.user1)
        
        response = client.get(f'/api/v1/forms/{self.form2.id}/')
        self.assertEqual(response.status_code, 404)
        
        # Try to update
        response = client.patch(
            f'/api/v1/forms/{self.form2.id}/',
            {'title': 'Hacked'}
        )
        self.assertEqual(response.status_code, 404)
        
        # Try to access submissions
        submission2 = Submission.objects.create(
            form=self.form2,
            respondent_key='org2-user'
        )
        
        response = client.get(
            f'/api/v1/forms/{self.form2.id}/submissions/{submission2.id}/'
        )
        self.assertEqual(response.status_code, 404)
    
    def test_query_level_isolation(self):
        """Test that ORM queries respect organization boundaries"""
        # Create submissions for both orgs
        for i in range(5):
            Submission.objects.create(
                form=self.form1,
                respondent_key=f'org1-{i}'
            )
            Submission.objects.create(
                form=self.form2,
                respondent_key=f'org2-{i}'
            )
        
        # User 1's view
        client1 = APIClient()
        client1.force_authenticate(user=self.user1)
        
        response = client1.get('/api/v1/submissions/')
        self.assertEqual(response.status_code, 200)
        
        # Should only see org1 submissions
        submissions = response.data['results']
        self.assertEqual(len(submissions), 5)
        for sub in submissions:
            self.assertTrue(sub['respondent_key'].startswith('org1-'))
    
    def test_raw_query_isolation(self):
        """Test isolation in raw SQL queries"""
        # This tests that developers using raw SQL still maintain isolation
        
        def get_submissions_for_user(user):
            with connection.cursor() as cursor:
                # Correct way - includes org check
                cursor.execute("""
                    SELECT s.* FROM core_submission s
                    JOIN forms_form f ON s.form_id = f.id
                    JOIN core_membership m ON f.organization_id = m.organization_id
                    WHERE m.user_id = %s
                """, [user.id])
                
                return cursor.fetchall()
        
        # User 1 should only see their submissions
        user1_subs = get_submissions_for_user(self.user1)
        
        # Create test data
        Submission.objects.create(form=self.form1)
        Submission.objects.create(form=self.form2)
        
        user1_subs_after = get_submissions_for_user(self.user1)
        self.assertEqual(len(user1_subs_after), len(user1_subs) + 1)


class TransactionSecurityTests(TransactionTestCase):
    """Test transaction isolation and atomicity"""
    
    def test_concurrent_submission_handling(self):
        """Test race conditions in concurrent submissions"""
        form = Form.objects.create(
            organization=Organization.objects.create(
                name='Test',
                slug='test'
            ),
            title='Test',
            settings={
                'max_submissions': 100
            }
        )
        
        from concurrent.futures import ThreadPoolExecutor
        from django.db import transaction
        
        def create_submission(index):
            try:
                with transaction.atomic():
                    # Check submission count
                    count = Submission.objects.filter(form=form).count()
                    
                    if count >= form.settings['max_submissions']:
                        raise Exception('Max submissions reached')
                    
                    # Create submission
                    Submission.objects.create(
                        form=form,
                        respondent_key=f'concurrent-{index}'
                    )
                    return True
            except Exception:
                return False
        
        # Try to create more than max submissions concurrently
        with ThreadPoolExecutor(max_workers=20) as executor:
            futures = [
                executor.submit(create_submission, i)
                for i in range(120)
            ]
            results = [f.result() for f in futures]
        
        # Should not exceed max submissions
        actual_count = Submission.objects.filter(form=form).count()
        self.assertLessEqual(actual_count, form.settings['max_submissions'])
    
    def test_deadlock_prevention(self):
        """Test that queries are ordered to prevent deadlocks"""
        org = Organization.objects.create(name='Test', slug='test')
        form = Form.objects.create(organization=org, title='Test')
        
        # Create two submissions that will be updated
        sub1 = Submission.objects.create(form=form, respondent_key='sub1')
        sub2 = Submission.objects.create(form=form, respondent_key='sub2')
        
        from concurrent.futures import ThreadPoolExecutor
        import time
        
        def update_submissions_ordered(order):
            with transaction.atomic():
                # Always lock in consistent order (by ID) to prevent deadlock
                subs = [sub1, sub2] if order else [sub2, sub1]
                subs_ordered = sorted(subs, key=lambda x: x.id)
                
                for sub in subs_ordered:
                    sub.metadata['updated'] = time.time()
                    sub.save()
                
                time.sleep(0.01)  # Increase chance of conflict
        
        # Run concurrent updates
        with ThreadPoolExecutor(max_workers=2) as executor:
            future1 = executor.submit(update_submissions_ordered, True)
            future2 = executor.submit(update_submissions_ordered, False)
            
            # Should complete without deadlock
            future1.result()
            future2.result()
        
        # Verify both were updated
        sub1.refresh_from_db()
        sub2.refresh_from_db()
        self.assertIn('updated', sub1.metadata)
        self.assertIn('updated', sub2.metadata)


class EncryptionTests(TestCase):
    """Test field-level encryption"""
    
    def test_sensitive_field_encryption(self):
        """Test that sensitive fields are encrypted in database"""
        from django.db import connection
        
        # Create answer with sensitive data
        submission = Submission.objects.create(
            form=Form.objects.create(
                organization=Organization.objects.create(
                    name='Test',
                    slug='test'
                ),
                title='Test'
            )
        )
        
        sensitive_data = {
            'ssn': '123-45-6789',
            'credit_card': '4111111111111111'
        }
        
        answer = Answer.objects.create(
            submission=submission,
            block_id='sensitive',
            type='sensitive',
            value=sensitive_data,
            is_sensitive=True
        )
        
        # Check raw database value
        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT value FROM core_answer WHERE id = %s",
                [answer.id]
            )
            raw_value = cursor.fetchone()[0]
        
        # Should not contain plaintext sensitive data
        raw_str = str(raw_value)
        self.assertNotIn('123-45-6789', raw_str)
        self.assertNotIn('4111111111111111', raw_str)
        
        # But ORM should decrypt transparently
        retrieved = Answer.objects.get(id=answer.id)
        self.assertEqual(retrieved.value['ssn'], '123-45-6789')
    
    def test_encryption_key_rotation(self):
        """Test ability to rotate encryption keys"""
        # This would test key rotation without data loss
        # In production, this would be a critical operation
        pass


class QueryOptimizationSecurityTests(TestCase):
    """Test that query optimizations don't bypass security"""
    
    def test_select_related_security(self):
        """Test that select_related respects permissions"""
        org1 = Organization.objects.create(name='Org1', slug='org1')
        org2 = Organization.objects.create(name='Org2', slug='org2')
        
        form1 = Form.objects.create(organization=org1, title='Form1')
        form2 = Form.objects.create(organization=org2, title='Form2')
        
        user = User.objects.create_user(username='test', password='test')
        user.memberships.create(organization=org1, role='viewer')
        
        # Even with select_related, should not see org2 data
        from django.db.models import Q
        
        # Simulate a query that might be generated
        forms = Form.objects.select_related('organization').filter(
            Q(organization__memberships__user=user)
        )
        
        self.assertEqual(forms.count(), 1)
        self.assertEqual(forms.first().id, form1.id)
    
    def test_prefetch_related_security(self):
        """Test that prefetch_related respects permissions"""
        org = Organization.objects.create(name='Test', slug='test')
        form = Form.objects.create(organization=org, title='Test')
        
        # Create submissions
        for i in range(5):
            sub = Submission.objects.create(
                form=form,
                respondent_key=f'test-{i}'
            )
            Answer.objects.create(
                submission=sub,
                block_id='email',
                type='email',
                value={'email': f'user{i}@example.com'}
            )
        
        user = User.objects.create_user(username='test', password='test')
        # User has no access to this org
        
        # Even with prefetch, should not see data
        submissions = Submission.objects.prefetch_related('answers').filter(
            form__organization__memberships__user=user
        )
        
        self.assertEqual(submissions.count(), 0)


class DatabaseConnectionSecurityTests(TestCase):
    """Test database connection security"""
    
    def test_connection_pooling_isolation(self):
        """Test that connection pooling maintains isolation"""
        # Different users should not share connection state
        from django.db import connections
        
        # This would test that connection pooling doesn't leak data
        # between requests from different users
        pass
    
    def test_sql_timeout_protection(self):
        """Test protection against long-running queries"""
        from django.db import connection
        from django.db.utils import OperationalError
        
        # Test that very long queries are terminated
        with self.assertRaises(OperationalError):
            with connection.cursor() as cursor:
                # This would need actual timeout configuration
                cursor.execute(
                    "SELECT pg_sleep(60)"  # 60 second sleep
                )
    
    def test_connection_encryption(self):
        """Test that database connections use SSL"""
        from django.db import connection
        
        # Check connection is encrypted
        with connection.cursor() as cursor:
            cursor.execute("SHOW ssl")
            result = cursor.fetchone()
            
            # PostgreSQL should show SSL is on
            self.assertEqual(result[0], 'on')


if __name__ == '__main__':
    pytest.main([__file__, '-v'])