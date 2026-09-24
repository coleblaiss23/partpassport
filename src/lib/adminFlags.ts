/**
 * In-process admin sandbox flags (not persisted).
 * Only mutated via authenticated /api/admin/sandbox/flags.
 */
export type AdminDevFlags = {
 disableRateLimit: boolean;
 aiModeOverride: "anthropic" | "local" | "off" | null;
 billingDevMock: boolean | null; // null = follow env
};

const flags: AdminDevFlags = {
 disableRateLimit: false,
 aiModeOverride: null,
 billingDevMock: null,
};

export function getAdminDevFlags(): AdminDevFlags {
 return { ...flags };
}

export function setAdminDevFlags(patch: Partial<AdminDevFlags>): AdminDevFlags {
 if (typeof patch.disableRateLimit === "boolean") flags.disableRateLimit = patch.disableRateLimit;
 if (patch.aiModeOverride === null || patch.aiModeOverride === "anthropic" || patch.aiModeOverride === "local" || patch.aiModeOverride === "off") {
 flags.aiModeOverride = patch.aiModeOverride;
 }
 if (patch.billingDevMock === null || typeof patch.billingDevMock === "boolean") {
 flags.billingDevMock = patch.billingDevMock ?? null;
 }
 return getAdminDevFlags();
}

export function resetAdminDevFlags(): AdminDevFlags {
 flags.disableRateLimit = false;
 flags.aiModeOverride = null;
 flags.billingDevMock = null;
 return getAdminDevFlags();
}
