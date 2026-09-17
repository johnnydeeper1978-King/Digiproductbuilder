import { useCallback, useEffect, useMemo, useState } from "react";
import { isSupabaseConfigured } from "@/config/env";
import { discoveryService, type SessionRef } from "@/services/discoveryService";
import { getStoredAnonToken, setStoredAnonToken } from "./storage";
import { DISCOVERY_QUESTIONS } from "./questions";
import { validateAnswer, validateAll, type FieldError } from "./validation";
import { mapAnswersToProfile } from "./profileMapper";
import type { AnswerMap, AnswerValue } from "./types";
import type { DiscoveryOutput } from "@/types/schemas/discovery-output";

type Phase = "intro" | "questions" | "submitting" | "done" | "error";

export function useDiscovery() {
  const questions = DISCOVERY_QUESTIONS;
  const [ref, setRef] = useState<SessionRef | null>(null);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("intro");
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<FieldError | null>(null);
  const [output, setOutput] = useState<DiscoveryOutput | null>(null);
  const [resuming, setResuming] = useState(false);
  /** True when persistence is unavailable (no backend configured yet). */
  const persistenceOff = !isSupabaseConfigured;

  const current = questions[index];
  const total = questions.length;
  const progress = Math.round(((index) / total) * 100);

  // Attempt to resume an in-progress session on mount.
  useEffect(() => {
    if (persistenceOff) return;
    let active = true;
    setResuming(true);
    discoveryService.resume(getStoredAnonToken())
      .then((res) => {
        if (!active || !res) return;
        const map: AnswerMap = {};
        for (const a of res.answers) map[a.question_key] = a.answer as AnswerValue;
        setRef(res.ref); setAnswers(map);
        const firstUnanswered = questions.findIndex((q) => map[q.key] === undefined);
        setIndex(firstUnanswered === -1 ? questions.length - 1 : firstUnanswered);
        setPhase("questions");
      })
      .catch(() => { /* start fresh */ })
      .finally(() => active && setResuming(false));
    return () => { active = false; };
  }, [persistenceOff, questions]);

  const setAnswer = useCallback((key: string, value: AnswerValue) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
    setFieldError(null);
  }, []);

  const begin = useCallback(async () => {
    setError(null);
    if (persistenceOff) { setPhase("questions"); return; }
    try {
      if (!ref) {
        const newRef = await discoveryService.start();
        if (newRef.anonToken) setStoredAnonToken(newRef.anonToken);
        setRef(newRef);
      }
      setPhase("questions");
    } catch (e) { setError(msg(e)); setPhase("error"); }
  }, [persistenceOff, ref]);

  const persistCurrent = useCallback(async () => {
    if (persistenceOff || !ref || !current) return;
    const value = answers[current.key];
    if (value === undefined) return;
    await discoveryService.saveAnswer(ref, {
      question_key: current.key, question_text: current.title, answer: value, sequence: index,
    });
  }, [persistenceOff, ref, current, answers, index]);

  const next = useCallback(async () => {
    const err = validateAnswer(current, answers[current.key]);
    if (err) { setFieldError(err); return; }
    try { await persistCurrent(); } catch (e) { setError(msg(e)); }
    if (index < total - 1) setIndex((i) => i + 1);
  }, [current, answers, persistCurrent, index, total]);

  const back = useCallback(() => { setFieldError(null); if (index > 0) setIndex((i) => i - 1); }, [index]);

  const submit = useCallback(async () => {
    const errs = validateAll(questions, answers);
    if (errs.length) { setFieldError(errs[0]); setIndex(questions.findIndex((q) => q.key === errs[0].key)); return; }
    if (persistenceOff || !ref) {
      setError("Discovery analysis needs the backend + an AI provider configured. Your answers aren't saved yet.");
      setPhase("error"); return;
    }
    setPhase("submitting"); setError(null);
    try {
      await persistCurrent();
      const { userProfile, metadata } = mapAnswersToProfile(answers);
      await discoveryService.saveProfile(ref, userProfile, metadata);
      const result = await discoveryService.analyze(ref);
      setOutput(result); setPhase("done");
    } catch (e) { setError(msg(e)); setPhase("error"); }
  }, [questions, answers, persistenceOff, ref, persistCurrent]);

  const isValidCurrent = useMemo(
    () => !validateAnswer(current, answers[current?.key]), [current, answers]);

  return {
    questions, current, index, total, progress, phase, error, fieldError, output,
    answers, resuming, persistenceOff, isValidCurrent, sessionRef: ref,
    setAnswer, begin, next, back, submit,
  };
}

function msg(e: unknown): string { return e instanceof Error ? e.message : "Something went wrong."; }
