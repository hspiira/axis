"""Management command to create a test user for API authentication."""
from django.core.management.base import BaseCommand
from apps.authentication.models import User, Profile
from datetime import date


class Command(BaseCommand):
    help = 'Creates a test admin user with profile for API authentication'

    def add_arguments(self, parser):
        parser.add_argument(
            '--email',
            type=str,
            default='admin@example.com',
            help='Email for the admin user'
        )
        parser.add_argument(
            '--password',
            type=str,
            default='admin123',
            help='Password for the admin user'
        )
        parser.add_argument(
            '--username',
            type=str,
            default='admin',
            help='Username for the admin user'
        )

    def handle(self, *args, **options):
        email = options['email']
        password = options['password']
        username = options['username']

        # Check if user already exists
        if User.objects.filter(email=email).exists():
            self.stdout.write(
                self.style.WARNING(f'User with email {email} already exists')
            )
            user = User.objects.get(email=email)
            # Update password
            user.set_password(password)
            user.is_superuser = True
            user.is_staff = True
            user.save()
            self.stdout.write(
                self.style.SUCCESS(f'Updated password for user: {email}')
            )
        else:
            # Create superuser
            user = User.objects.create_superuser(
                email=email,
                username=username,
                password=password
            )
            self.stdout.write(
                self.style.SUCCESS(f'Created admin user: {email}')
            )

            # Create profile if doesn't exist
            if not hasattr(user, 'profile'):
                profile = Profile.objects.create(
                    user=user,
                    full_name='Admin User',
                    dob=date(1990, 1, 1),
                    gender='M'
                )
                self.stdout.write(
                    self.style.SUCCESS(f'Created profile for user: {email}')
                )

        # Display login instructions
        self.stdout.write('\n' + '=' * 70)
        self.stdout.write(self.style.SUCCESS('Admin User Created Successfully!'))
        self.stdout.write('=' * 70)
        self.stdout.write(f'\nCredentials:')
        self.stdout.write(f'  Email:    {email}')
        self.stdout.write(f'  Password: {password}')
        self.stdout.write(f'\nTo get an access token, run:')
        self.stdout.write(f'  curl -X POST http://localhost:8000/api/auth/token/ \\')
        self.stdout.write(f'    -H "Content-Type: application/json" \\')
        self.stdout.write(f'    -d \'{{"email": "{email}", "password": "{password}"}}\'')
        self.stdout.write(f'\nOr use httpie:')
        self.stdout.write(f'  http POST http://localhost:8000/api/auth/token/ email={email} password={password}')
        self.stdout.write('\n' + '=' * 70 + '\n')
