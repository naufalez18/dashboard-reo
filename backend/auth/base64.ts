export function base64Encode(data: string): string {
  return Buffer.from(data, "utf8").toString("base64");
}

export function base64Decode(data: string): string {
  return Buffer.from(data, "base64").toString("utf8");
}
