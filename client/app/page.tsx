"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Snowfall from "react-snowfall";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { translations } from "@/lib/translations";
import { toast } from "sonner";
import {
  Flame,
  Beef,
  Wheat,
  Droplets,
  Star,
  UtensilsCrossed,
} from "lucide-react";

type Result = {
  food_name: string;
  carbs_g: number;
  protein_g: number;
  fat_g: number;
  health_rating: number;
  estimated_calories: number;
};

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [language, setLanguage] = useState<"vi" | "en">("vi");

  const MAX_BYTES = 3 * 1024 * 1024;

  const t = translations[language];

  useEffect(() => {
    const stored = window.localStorage.getItem("ui-language");
    if (stored === "en" || stored === "vi") {
      setLanguage(stored);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("ui-language", language);
  }, [language]);
  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  async function analyzeImage() {
    if (!file) return;

    if (file.size > MAX_BYTES) {
      toast.error(t.errorTitle, {
        description: t.fileTooLarge,
      });
      setFile(null);
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("image", file);
      formData.append("language", language);

      const { data } = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/analyze-image`,
        formData
      );

      setResult(data);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 413) {
          toast.error(t.errorTitle, {
            description: t.fileTooLarge,
          });
        } else {
          toast.error(t.errorTitle, {
            description: t.uploadFailed,
          });
        }
      } else {
        toast.error(t.errorTitle, {
          description: t.uploadFailed,
        });
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden flex items-center justify-center p-6">
      <div className="absolute inset-0 -z-10">
        <img
          src="/doraemonbg.gif"
          alt=""
          className="h-full w-full object-cover opacity-[100%]"
        />
        <div className="absolute inset-0 bg-black/60" />
      </div>
      <Snowfall
        color="#f4e7cf"
        snowflakeCount={180}
        radius={[1.2, 3.6]}
        speed={[0.4, 1.1]}
        wind={[-0.2, 0.6]}
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          zIndex: 10,
        }}
      />
      <Card className="relative z-20 w-full max-w-5xl border-border/60 bg-card/10 shadow-2xl backdrop-blur">
        <CardContent className="flex flex-col gap-8 p-8">
          <div className="relative space-y-2 text-center">
            <div className="absolute right-0 top-0">
              <div className="inline-flex items-center rounded-full border border-primary/30 bg-background/70 p-1 shadow-sm backdrop-blur">
                <button
                  type="button"
                  onClick={() => setLanguage("vi")}
                  className={`rounded-full px-3 py-1 text-xs font-semibold uppercase transition ${
                    language === "vi"
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground/70 hover:text-foreground"
                  }`}
                  aria-pressed={language === "vi"}
                >
                  VI
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage("en")}
                  className={`rounded-full px-3 py-1 text-xs font-semibold uppercase transition ${
                    language === "en"
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground/70 hover:text-foreground"
                  }`}
                  aria-pressed={language === "en"}
                >
                  EN
                </button>
              </div>
            </div>
            <h1 className="text-3xl font-bold">
              {t.title}
            </h1>

            <p className="text-sm text-muted-foreground">
              {t.subtitle}
            </p>
          </div>

          <Card className="rounded-2xl border-border/60 bg-muted/30">
            <CardContent className="flex flex-col gap-4 p-4 md:flex-row md:items-center">
              <div className="md:w-64">
                <p className="text-sm font-medium">
                  {t.uploadTitle}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t.uploadHint}
                </p>
              </div>

              <div className="w-full md:flex-1">
                <Input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => {
                    const picked = e.target.files?.[0] ?? null;

                    if (!picked) {
                      setFile(null);
                      return;
                    }

                    if (picked.size > MAX_BYTES) {
                      setFile(null);
                      toast.error(t.errorTitle, {
                        description: t.fileTooLarge,
                      });
                      e.target.value = "";
                      return;
                    }

                    setResult(null);
                    setFile(picked);
                  }}
                  className="w-full"
                />
              </div>
            </CardContent>
          </Card>

          <div className="w-full">
            <Button
              onClick={analyzeImage}
              disabled={!file || loading}
              className="py-[20px] w-full text-base"
            >
              {loading ? t.analyzing : t.submit}
            </Button>
          </div>

          {result && (
            <Card className="rounded-3xl border-border/60 bg-muted/20">
              <CardContent className="grid items-start gap-6 p-5 md:grid-cols-[1.05fr_1fr]">
                <div className="overflow-hidden rounded-2xl bg-background/30 p-3">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Uploaded food"
                      className="max-h-80 w-full object-contain"
                    />
                  ) : (
                        <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
                          {t.imagePreview}
                        </div>
                  )}
                </div>

                <div className="flex h-full flex-col gap-6">
                  <div className="flex items-center gap-4">
                    <div className="rounded-2xl bg-primary/10 p-3">
                      <UtensilsCrossed className="h-6 w-6 text-primary" />
                    </div>

                    <div>
                      <h2 className="text-2xl font-bold">
                        {result.food_name}
                      </h2>

                      <p className="text-sm text-muted-foreground">
                        {t.nutritionTitle}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <Card className="rounded-2xl border-border/60 bg-background/40">
                      <CardContent className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-3">
                          <div className="rounded-xl bg-orange-500/10 p-2">
                            <Flame className="h-4 w-4 text-orange-500" />
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {t.calories}
                          </p>
                        </div>
                        <p className="text-sm font-semibold">
                          {result.estimated_calories}
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="rounded-2xl border-border/60 bg-background/40">
                      <CardContent className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-3">
                          <div className="rounded-xl bg-amber-500/10 p-2">
                            <Wheat className="h-4 w-4 text-amber-500" />
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {t.carbs}
                          </p>
                        </div>
                        <p className="text-sm font-semibold">
                          {result.carbs_g}g
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="rounded-2xl border-border/60 bg-background/40">
                      <CardContent className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-3">
                          <div className="rounded-xl bg-red-500/10 p-2">
                            <Beef className="h-4 w-4 text-red-500" />
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {t.protein}
                          </p>
                        </div>
                        <p className="text-sm font-semibold">
                          {result.protein_g}g
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="rounded-2xl border-border/60 bg-background/40">
                      <CardContent className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-3">
                          <div className="rounded-xl bg-blue-500/10 p-2">
                            <Droplets className="h-4 w-4 text-blue-500" />
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {t.fat}
                          </p>
                        </div>
                        <p className="text-sm font-semibold">
                          {result.fat_g}g
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="rounded-2xl border-border/60 bg-background/40">
                      <CardContent className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-3">
                          <div className="rounded-xl bg-yellow-500/10 p-2">
                            <Star className="h-4 w-4 text-yellow-500" />
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {t.rating}
                          </p>
                        </div>
                        <p className="text-sm font-semibold">
                          {result.health_rating}/10
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </main>
  );
}