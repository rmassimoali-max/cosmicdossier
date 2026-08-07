import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { NatalChart } from "./astro";
import { buildChart } from "./ephemeris";

const Input = z.object({
  date: z.string(), // YYYY-MM-DD
  time: z.string().optional(), // HH:MM
  place: z.string().min(1),
});

export const computeNatalChart = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data }): Promise<NatalChart> => {
    const geoRes = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?count=1&language=en&format=json&name=${encodeURIComponent(
        data.place,
      )}`,
    );
    const geo = (await geoRes.json()) as {
      results?: {
        name: string;
        country?: string;
        admin1?: string;
        latitude: number;
        longitude: number;
        timezone?: string;
      }[];
    };
    const hit = geo.results?.[0];
    if (!hit) throw new Error(`Could not find birth place "${data.place}". Try "City, Country".`);

    return buildChart({
      date: data.date,
      time: data.time,
      latitude: hit.latitude,
      longitude: hit.longitude,
      placeLabel: [hit.name, hit.admin1, hit.country].filter(Boolean).join(", "),
      timeZone: hit.timezone,
    });
  });
