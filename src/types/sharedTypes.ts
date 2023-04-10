import { ReactNode } from "react";

export interface ChildrenProps {
  children?: ReactNode;
}

export interface LoginFunction {
  email: string;
  password: string;
}

export interface RegisterFunction extends LoginFunction {
  name: string;
  companyName: string;
}

export interface ResponseInterface {
  data: {
    success: boolean;
    data: any;
  };
}
