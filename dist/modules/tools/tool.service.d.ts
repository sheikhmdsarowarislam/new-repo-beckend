import { ServiceResponse } from "../../@types/api";
export declare const createTool: (data: any, instructorId: string) => Promise<ServiceResponse<any>>;
export declare const updateTool: (toolId: string, data: any, userId: string, userRole: string) => Promise<ServiceResponse<any>>;
export declare const deleteTool: (toolId: string, userId: string, userRole: string) => Promise<ServiceResponse<null>>;
export declare const getAllTools: () => Promise<ServiceResponse<any>>;
export declare const getAllToolsAdmin: () => Promise<ServiceResponse<any>>;
export declare const getToolById: (toolId: string) => Promise<ServiceResponse<any>>;
//# sourceMappingURL=tool.service.d.ts.map