// frontend/lib/api/api_migration.ts
import axiosClient from "./axiosClient";

export const getMigrationStatus = async (limit: number = 10) => {
  const response = await axiosClient.get(`/migration/status?limit=${limit}`);
  return response.data;
};

export const startMigrationBatch = async (batchSize: number) => {
  const response = await axiosClient.post(`/migration/start-batch?batch_size=${batchSize}`);
  return response.data;
};