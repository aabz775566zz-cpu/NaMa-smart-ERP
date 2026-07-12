import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const MODULES = [
  'PRODUCTS',
  'CUSTOMERS',
  'SALES',
  'INVENTORY',
  'INVOICES',
  'USERS',
  'SETTINGS',
  'REPORTS',
] as const;

const ACTIONS = ['CREATE', 'READ', 'UPDATE', 'DELETE', 'EXPORT'] as const;

const ALL_PERMISSIONS: string[] = MODULES.flatMap((module) =>
  ACTIONS.map((action) => `${module}:${action}`),
);

// Default permission grid for the four seeded system roles.
// OWNER gets everything; the rest are deliberately scoped per
// docs/09_Security_Plan.md section 3.
const SYSTEM_ROLES: Array<{ key: string; name: string; permissions: string[] }> = [
  {
    key: 'OWNER',
    name: 'Owner',
    permissions: ALL_PERMISSIONS,
  },
  {
    key: 'MANAGER',
    name: 'Manager',
    permissions: [
      ...['PRODUCTS', 'CUSTOMERS', 'SALES', 'INVENTORY', 'INVOICES', 'REPORTS'].flatMap((m) =>
        ACTIONS.map((a) => `${m}:${a}`),
      ),
      'USERS:CREATE',
      'USERS:READ',
      'USERS:UPDATE',
      'SETTINGS:READ',
    ],
  },
  {
    key: 'ACCOUNTANT',
    name: 'Accountant',
    permissions: [
      'PRODUCTS:READ',
      'CUSTOMERS:READ',
      'SALES:READ',
      'SALES:EXPORT',
      'INVOICES:CREATE',
      'INVOICES:READ',
      'INVOICES:UPDATE',
      'INVOICES:EXPORT',
      'REPORTS:READ',
      'REPORTS:EXPORT',
    ],
  },
  {
    key: 'EMPLOYEE',
    name: 'Employee',
    permissions: [
      'PRODUCTS:READ',
      'CUSTOMERS:READ',
      'CUSTOMERS:CREATE',
      'INVENTORY:READ',
      'SALES:CREATE',
      'SALES:READ',
    ],
  },
];

async function main() {
  console.log('Seeding permissions...');
  const permissionsByKey = new Map<string, { id: string }>();

  for (const key of ALL_PERMISSIONS) {
    const [module, action] = key.split(':');
    const permission = await prisma.permission.upsert({
      where: { module_action: { module, action } },
      update: {},
      create: { module, action },
    });
    permissionsByKey.set(key, permission);
  }

  console.log('Seeding system roles...');
  for (const roleDef of SYSTEM_ROLES) {
    // Prisma's compound-unique `where` rejects an explicit null for a nullable
    // column (companyId), so global system roles are looked up with findFirst
    // instead of upsert's unique-where shortcut.
    const existingRole = await prisma.role.findFirst({
      where: { companyId: null, key: roleDef.key },
    });
    const role = existingRole
      ? await prisma.role.update({
          where: { id: existingRole.id },
          data: { name: roleDef.name, isSystem: true },
        })
      : await prisma.role.create({
          data: {
            companyId: null,
            key: roleDef.key,
            name: roleDef.name,
            isSystem: true,
          },
        });

    for (const permKey of roleDef.permissions) {
      const permission = permissionsByKey.get(permKey);
      if (!permission) continue;

      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: { roleId: role.id, permissionId: permission.id },
        },
        update: {},
        create: { roleId: role.id, permissionId: permission.id },
      });
    }
  }

  console.log('Seed complete.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
