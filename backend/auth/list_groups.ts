import { api, Header } from "encore.dev/api";
import { requireAdmin } from "./middleware";

interface ListGroupsParams {
  authorization?: Header<"Authorization">;
}

interface Group {
  id: string;
  name: string;
}

interface ListGroupsResponse {
  groups: Group[];
}

export const listGroups = api<ListGroupsParams, ListGroupsResponse>(
  { expose: true, method: "GET", path: "/groups" },
  async (params) => {
    await requireAdmin(params.authorization);
    
    return { groups: [] };
  }
);
