export async function GET() {
  return Response.json(
    {
      ok: true,
      service: "rivet-web",
      timestamp: new Date().toISOString(),
    },
    { status: 200 }
  );
}

