export interface AssetEntity {
  id: string;
  tenantId: string;
  ownerId: string;
  name: string;
  description: string | null;
  type: string;
  status: string;
  metadata: any;
  createdAt: Date;
  updatedAt: Date;
}
