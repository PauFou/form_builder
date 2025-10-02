"""
Management command to set up ClickHouse analytics database
"""
import os
import sys
from django.core.management.base import BaseCommand

from analytics.clickhouse_client import ClickHouseClient


class Command(BaseCommand):
    help = 'Set up ClickHouse analytics database and tables'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--drop-existing',
            action='store_true',
            help='Drop existing database before creating'
        )
    
    def handle(self, *args, **options):
        try:
            # Read SQL file
            sql_file = os.path.join(
                os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))),
                '..', '..', '..', 'docker', 'clickhouse', 'init-db.sql'
            )
            
            if not os.path.exists(sql_file):
                self.stdout.write(self.style.ERROR(f"SQL file not found: {sql_file}"))
                return
            
            with open(sql_file, 'r') as f:
                sql_content = f.read()
            
            # Initialize client
            client = ClickHouseClient()
            
            # Parse and execute SQL statements
            self.stdout.write("Setting up ClickHouse analytics database...")
            
            if options['drop_existing']:
                self.stdout.write("Dropping existing database...")
                try:
                    client._execute_query("DROP DATABASE IF EXISTS forms_analytics")
                    self.stdout.write(self.style.SUCCESS("✓ Dropped existing database"))
                except Exception as e:
                    self.stdout.write(self.style.WARNING(f"Could not drop database: {e}"))
            
            # Execute SQL statements
            statements = [s.strip() for s in sql_content.split(';') if s.strip()]
            
            for i, statement in enumerate(statements):
                if statement.startswith('--') or not statement:
                    continue
                    
                try:
                    # Special handling for USE statement
                    if statement.upper().startswith('USE '):
                        self.stdout.write("Switching to database...")
                        # Update client database
                        db_name = statement.split()[1]
                        client.database = db_name
                    else:
                        client._execute_query(statement)
                    
                    # Log progress
                    if 'CREATE DATABASE' in statement:
                        self.stdout.write(self.style.SUCCESS("✓ Created database"))
                    elif 'CREATE TABLE' in statement:
                        table_name = statement.split('IF NOT EXISTS')[1].split('(')[0].strip()
                        self.stdout.write(self.style.SUCCESS(f"✓ Created table: {table_name}"))
                    elif 'CREATE MATERIALIZED VIEW' in statement:
                        view_name = statement.split('IF NOT EXISTS')[1].split()[0].strip()
                        self.stdout.write(self.style.SUCCESS(f"✓ Created view: {view_name}"))
                    elif 'ALTER TABLE' in statement:
                        self.stdout.write(self.style.SUCCESS("✓ Added indexes"))
                        
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f"Error executing statement {i+1}: {str(e)}"))
                    self.stdout.write(f"Statement: {statement[:100]}...")
                    if 'already exists' not in str(e).lower():
                        sys.exit(1)
            
            # Test connection
            self.stdout.write("\nTesting connection...")
            try:
                result = client._execute_query("SELECT 1 as test")
                if result and result[0].get('test') == 1:
                    self.stdout.write(self.style.SUCCESS("✓ ClickHouse connection successful"))
                else:
                    self.stdout.write(self.style.ERROR("✗ ClickHouse connection test failed"))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"✗ ClickHouse connection error: {e}"))
            
            # Show summary
            self.stdout.write("\nAnalytics database setup summary:")
            self.stdout.write(f"  - URL: {client.base_url}")
            self.stdout.write(f"  - Database: {client.database}")
            self.stdout.write("  - Tables: form_views, form_interactions, form_submissions")
            self.stdout.write("  - Aggregates: form_performance_hourly, field_analytics")
            self.stdout.write("  - Views: form_funnel_mv")
            
            self.stdout.write(self.style.SUCCESS("\n✓ ClickHouse setup completed successfully"))
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Setup failed: {str(e)}"))