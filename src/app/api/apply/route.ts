import { NextRequest, NextResponse } from "next/server";
import { runApplication } from "@/lib/automation/engine";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const jobUrl = body?.jobUrl as string | undefined;

  if (!jobUrl || !jobUrl.startsWith("http")) {
    return NextResponse.json({ error: "A valid jobUrl is required." }, { status: 400 });
  }

  try {
    const result = await runApplication(jobUrl);
    return NextResponse.json(result, { status: result.status === "submitted" ? 200 : 500 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
