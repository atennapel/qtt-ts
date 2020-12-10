import { addUsesRig, Lin, linear, lubUsesRig, multiplyUsesRig, noUsesRig, UsesRig } from './porig';

export type Usage = Lin;
export const Usage = Lin;
export const UsageRig = linear;

// derived
export type Uses = UsesRig<Usage>;

export const noUses = (size: number): Uses => noUsesRig(UsageRig, size);
export const addUses = (a: Uses, b: Uses): Uses => addUsesRig(UsageRig, a, b);
export const multiplyUses = (a: Usage, b: Uses): Uses => multiplyUsesRig(UsageRig, a, b);
export const lubUses = (a: Uses, b: Uses): Uses | null => lubUsesRig(UsageRig, a, b);
