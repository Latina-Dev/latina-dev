import { NextResponse } from "next/server"
import * as members from 'data/members.json'

export async function GET(request: Request) {
  return NextResponse.json(members)
}