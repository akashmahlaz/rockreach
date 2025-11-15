"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, MapPin, ExternalLink, Lightbulb } from "lucide-react";
import type { Profile } from "./profile-list";

interface ProfileCardProps {
  profile: Profile | null;
}

export function ProfileCard({ profile }: ProfileCardProps) {
  if (!profile) {
    return (
      <Card className="rounded-2xl sm:rounded-3xl border-2 border-slate-100 bg-white shadow-lg">
        <CardContent className="p-8 sm:p-12 text-center">
          <div className="text-slate-400">
            <Lightbulb className="h-12 w-12 mx-auto mb-4" />
            <p className="text-lg font-medium">Select a profile to view details</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl sm:rounded-3xl border-2 border-slate-200 bg-white/95 backdrop-blur-sm shadow-2xl">
      <CardHeader className="pb-4">
        <div className="space-y-1">
          <p className="text-sm font-bold uppercase tracking-wide text-slate-500 font-serif">
            Profile Details
          </p>
          <CardTitle className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 font-serif">
            {profile.name}
          </CardTitle>
          <p className="text-base sm:text-lg text-slate-600">
            {profile.title} · {profile.company}
          </p>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mt-4">
          {profile.tags.map((tag) => (
            <Badge
              key={tag}
              className="rounded-full bg-gradient-to-r from-amber-100 to-amber-50 border border-amber-200 px-3 py-1 text-sm font-semibold text-amber-700"
            >
              {tag}
            </Badge>
          ))}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Contact Information */}
        <div className="rounded-xl sm:rounded-2xl border-2 border-slate-100 bg-slate-50 p-4 sm:p-5 space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-slate-600">
              <Mail className="h-5 w-5" />
              <span className="text-sm font-medium">Email</span>
            </div>
            <span className="text-sm font-bold text-slate-900">{profile.email}</span>
          </div>

          {profile.phone && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-slate-600">
                <Phone className="h-5 w-5" />
                <span className="text-sm font-medium">Phone</span>
              </div>
              <span className="text-sm font-bold text-slate-900">{profile.phone}</span>
            </div>
          )}

          {profile.location && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-slate-600">
                <MapPin className="h-5 w-5" />
                <span className="text-sm font-medium">Location</span>
              </div>
              <span className="text-sm font-bold text-slate-900">{profile.location}</span>
            </div>
          )}

          {profile.linkedinUrl && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-slate-600">
                <ExternalLink className="h-5 w-5" />
                <span className="text-sm font-medium">LinkedIn</span>
              </div>
              <a
                href={profile.linkedinUrl}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-bold text-indigo-600 hover:text-indigo-700 hover:underline"
              >
                View Profile
              </a>
            </div>
          )}
        </div>

        {/* AI Insights */}
        <div className="rounded-xl sm:rounded-2xl border-2 border-amber-100 bg-gradient-to-br from-amber-50 to-amber-50/50 p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="h-5 w-5 text-indigo-600" />
            <p className="text-sm font-bold uppercase tracking-wide text-indigo-900">
              AI Insights
            </p>
          </div>
          <ul className="space-y-2 text-sm text-slate-700">
            <li className="flex items-start gap-2">
              <span className="text-indigo-600 font-bold">•</span>
              <span>Likely focused on revenue partnerships and high-value initiatives.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-indigo-600 font-bold">•</span>
              <span>Prefers concise pitches highlighting ROI and speed to value.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-indigo-600 font-bold">•</span>
              <span>Best hook: mention verified lead pipeline tailored to their goals.</span>
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
