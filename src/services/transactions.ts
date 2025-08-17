// src/services/transactions.ts
type ExpenseReq = {
  group_id: number;
  amount: number;
  currency: string;
  date: string;
  comment: string;
  category?: { id: number; name: string; color?: string | null; icon?: string | undefined };
  paid_by?: number;
  split?: any; // серверная схема сплита
};

type TransferReq = {
  group_id: number;
  amount: number;
  currency: string;
  date: string;
  from_user_id: number;
  to_user_id: number;
  from_name?: string;
  to_name?: string;
  from_avatar?: string;
  to_avatar?: string;
};

const API = (import.meta as any).env?.VITE_API_URL || "/api";

async function postJSON(path: string, body: any) {
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    credentials: "include",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json().catch(() => ({}));
}

export async function createExpenseAPI(req: ExpenseReq): Promise<any> {
  // при необходимости поменяй путь на свой
  return postJSON(`/transactions/expense`, req);
}

export async function createTransferAPI(req: TransferReq): Promise<any> {
  // при необходимости поменяй путь на свой
  return postJSON(`/transactions/transfer`, req);
}
