/**
 * Regression tests for the PR #5 role-priority bug.
 *
 * The role priority map is `{ [Role.Admin]: 0, [Role.Manager]: 1, ... }` and the
 * sort used `roleOrder[a.role] || 99`, which coerced the Admin entry (priority
 * 0) into the fallback value 99. An Admin therefore sorted last, so any user
 * holding Admin together with another role lost its highest-priority role and
 * admin permissions. The fix uses `?? 99` so a real priority of 0 is kept.
 */
import { describe, it, expect } from 'vitest';
import { PermissionChecker } from './checker';
import { PermissionScope, Role, type UserRole } from './types';

const makeRole = (role: Role, scope: PermissionScope = PermissionScope.Tenant): UserRole =>
  ({
    id: `role-${role}`,
    tenantId: 'tenant-1',
    userId: 'user-1',
    role,
    scope,
    createdAt: new Date(),
    updatedAt: new Date(),
  }) as UserRole;

describe('PermissionChecker role priority', () => {
  it('preserves Admin (priority 0) as the effective role', () => {
    const checker = new PermissionChecker([makeRole(Role.Admin)]);

    expect(checker.getUserRole()).toBe(Role.Admin);
    expect(checker.isAdmin()).toBe(true);
    expect(checker.canAdmin().allowed).toBe(true);
  });

  it('keeps Admin when a user holds several roles', () => {
    const checker = new PermissionChecker([
      makeRole(Role.User),
      makeRole(Role.Admin),
      makeRole(Role.Viewer),
    ]);

    expect(checker.getUserRole()).toBe(Role.Admin);
    expect(checker.isAdmin()).toBe(true);
  });

  it('keeps Admin when a higher number is executed first', () => {
    const checker = new PermissionChecker([makeRole(Role.Admin), makeRole(Role.Manager)]);

    expect(checker.getUserRole()).toBe(Role.Admin);
  });

  it('orders non-admin roles by priority', () => {
    expect(new PermissionChecker([makeRole(Role.Viewer), makeRole(Role.User)]).getUserRole()).toBe(
      Role.User
    );
    expect(new PermissionChecker([makeRole(Role.User), makeRole(Role.Manager)]).getUserRole()).toBe(
      Role.Manager
    );
    expect(
      new PermissionChecker([makeRole(Role.Viewer), makeRole(Role.Manager)]).getUserRole()
    ).toBe(Role.Manager);
  });

  it('still keeps the first sorted entry when two roles are tied', () => {
    const checker = new PermissionChecker([makeRole(Role.Admin), makeRole(Role.Admin)]);

    expect(checker.getUserRole()).toBe(Role.Admin);
    expect(checker.isAdmin()).toBe(true);
  });
});
