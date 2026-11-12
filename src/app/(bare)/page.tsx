import { Landing } from "@/components/landing/Landing";
import { getPostOffices } from "@/lib/offices";

export default async function HomePage() {
  const offices = await getPostOffices();
  return <Landing offices={offices} />;
}
