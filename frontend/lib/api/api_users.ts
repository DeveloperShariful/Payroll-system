// frontend/lib/api/api_users.ts
import axiosClient from "./axiosClient";
import { User } from "../../types";

export const getUsers = async (): Promise<User[]> => {
  const response = await axiosClient.get("/users/");
  return response.data;
};

export const createUser = async (data: any): Promise<User> => {
  const response = await axiosClient.post("/users/", data);
  return response.data;
};

export const updateUser = async (id: number, data: any): Promise<User> => {
  const response = await axiosClient.patch(`/users/${id}`, data);
  return response.data;
};