import { NextRequest } from "next/server";

// В реальном приложении здесь будет взаимодействие с базой данных
let notifications: any[] = [];

export async function GET() {
  return new Response(JSON.stringify(notifications), {
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(request: NextRequest) {
  const data = await request.json();
  notifications = data;
  return new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json" },
  });
}

export async function DELETE() {
  notifications = [];
  return new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json" },
  });
}
