from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

from config.init_config import USERS_CONFIG, PROPERTIES_CONFIG
from core.models import Property, ResidentProfile, StaffProfile, UserRole
from users.models import UserProfile


User = get_user_model()


class Command(BaseCommand):
    help = "Create demo users for the superadmin, manager, staff, and residents."

    def add_arguments(self, parser):
        parser.add_argument(
            "--property-name",
            default=PROPERTIES_CONFIG[0]["name"],
            help="Property name to create/use for staff and residents.",
        )
        parser.add_argument(
            "--property-address",
            default=PROPERTIES_CONFIG[0]["address"],
            help="Property address to create/use for staff and residents.",
        )
        parser.add_argument(
            "--property-description",
            default=PROPERTIES_CONFIG[0]["description"],
            help="Property description to create/use for staff and residents.",
        )
        parser.add_argument(
            "--superadmin-password",
            default="Superadmin@123",
            help="Password for the created superadmin account.",
        )
        parser.add_argument(
            "--manager-password",
            default=USERS_CONFIG["manager"]["password"],
            help="Password for the created manager account.",
        )
        parser.add_argument(
            "--staff-password",
            default=USERS_CONFIG["staff"][0]["password"],
            help="Password for the created staff accounts.",
        )
        parser.add_argument(
            "--resident-password",
            default=USERS_CONFIG["residents"][0]["password"],
            help="Password for the created resident accounts.",
        )

    def handle(self, *args, **options):
        property_name = options["property_name"]
        property_address = options["property_address"]
        property_description = options["property_description"]

        self.stdout.write(self.style.MIGRATE_HEADING("Seeding demo users"))

        self._create_user(
            username="superadmin",
            email="superadmin@maintenanceservices.co.zw",
            password=options["superadmin_password"],
            first_name="System",
            last_name="Super Admin",
            is_staff=True,
            is_superuser=True,
            role="manager",
            note="superadmin",
        )

        manager_config = USERS_CONFIG["manager"]
        manager = self._create_user(
            username=manager_config["username"],
            email=manager_config["email"],
            password=options["manager_password"],
            first_name=manager_config["first_name"],
            last_name=manager_config["last_name"],
            is_staff=True,
            is_superuser=False,
            role="manager",
            note="manager",
        )

        property_obj, property_created = Property.objects.get_or_create(
            name=property_name,
            defaults={
                "address": property_address,
                "description": property_description,
                "manager": manager,
                "status": "active",
            },
        )

        if not property_created:
            changed = False
            if property_obj.address != property_address:
                property_obj.address = property_address
                changed = True
            if property_obj.description != property_description:
                property_obj.description = property_description
                changed = True
            if property_obj.manager_id != manager.id:
                property_obj.manager = manager
                changed = True
            if property_obj.status != "active":
                property_obj.status = "active"
                changed = True
            if changed:
                property_obj.save()

        self.stdout.write(
            self.style.SUCCESS(
                f"Property ready: {property_obj.name}"
            )
        )

        for staff_config in USERS_CONFIG["staff"]:
            staff_user = self._create_user(
                username=staff_config["username"],
                email=staff_config["email"],
                password=options["staff_password"],
                first_name=staff_config["first_name"],
                last_name=staff_config["last_name"],
                is_staff=False,
                is_superuser=False,
                role="maintenance_staff",
                note="staff",
            )
            StaffProfile.objects.update_or_create(
                user=staff_user,
                defaults={
                    "property": property_obj,
                    "role_title": "Maintenance Staff",
                    "phone": staff_config.get("phone", ""),
                },
            )

        for resident_config in USERS_CONFIG["residents"]:
            resident_user = self._create_user(
                username=resident_config["username"],
                email=resident_config["email"],
                password=options["resident_password"],
                first_name=resident_config["first_name"],
                last_name=resident_config["last_name"],
                is_staff=False,
                is_superuser=False,
                role="resident",
                note="resident",
            )
            ResidentProfile.objects.update_or_create(
                user=resident_user,
                defaults={
                    "phone": resident_config.get("phone", ""),
                    "address": resident_config.get("address", ""),
                    "unit_number": resident_config.get("unit_number", ""),
                    "property": property_obj,
                },
            )

        self.stdout.write(self.style.SUCCESS("Demo users created successfully."))
        self.stdout.write("\nCreated/updated accounts:")
        self.stdout.write(f"  - superadmin: superadmin")
        self.stdout.write(f"  - manager: {manager.username}")
        self.stdout.write(
            f"  - staff: {', '.join(staff['username'] for staff in USERS_CONFIG['staff'])}"
        )
        self.stdout.write(
            f"  - residents: {', '.join(resident['username'] for resident in USERS_CONFIG['residents'])}"
        )
        self.stdout.write("\nPasswords:")
        self.stdout.write(f"  - superadmin: {options['superadmin_password']}")
        self.stdout.write(f"  - manager: {options['manager_password']}")
        self.stdout.write(f"  - staff: {options['staff_password']}")
        self.stdout.write(f"  - residents: {options['resident_password']}")

    def _create_user(
        self,
        *,
        username,
        email,
        password,
        first_name,
        last_name,
        is_staff,
        is_superuser,
        role,
        note,
    ):
        user, created = User.objects.get_or_create(
            username=username,
            defaults={
                "email": email,
                "first_name": first_name,
                "last_name": last_name,
                "is_staff": is_staff,
                "is_superuser": is_superuser,
            },
        )

        changed = created
        if user.email != email:
            user.email = email
            changed = True
        if user.first_name != first_name:
            user.first_name = first_name
            changed = True
        if user.last_name != last_name:
            user.last_name = last_name
            changed = True
        if user.is_staff != is_staff:
            user.is_staff = is_staff
            changed = True
        if user.is_superuser != is_superuser:
            user.is_superuser = is_superuser
            changed = True
        if created or not user.check_password(password):
            user.set_password(password)
            changed = True
        if changed:
            user.save()

        UserProfile.objects.get_or_create(user=user)
        UserRole.objects.update_or_create(user=user, defaults={"role": role})

        self.stdout.write(
            self.style.SUCCESS(
                f"{note.capitalize()} account ready: {username}"
            )
        )
        return user
