"use client";
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Loader2 } from 'lucide-react';

export default function BillDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { congress, type, number } = params;
  const [bill, setBill] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [translation, setTranslation] = useState<string | null>(null);
  const [translating, setTranslating] = useState(false);
  const [translationError, setTranslationError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBill() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/bills/${congress}/${type}/${number}`);
        if (!res.ok) throw new Error('Failed to fetch bill details');
        const data = await res.json();
        setBill(data.bill);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch bill details');
      } finally {
        setLoading(false);
      }
    }
    if (congress && type && number) fetchBill();
  }, [congress, type, number]);

  useEffect(() => {
    async function fetchTranslation(summary: string) {
      setTranslating(true);
      setTranslationError(null);
      setTranslation(null);
      try {
        const res = await fetch('/api/translate-summary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ summary })
        });
        if (!res.ok) throw new Error('Failed to translate summary');
        const data = await res.json();
        setTranslation(data.translation);
      } catch (err: any) {
        setTranslationError(err.message || 'Failed to translate summary');
      } finally {
        setTranslating(false);
      }
    }
    if (bill && bill.summary) {
      fetchTranslation(bill.summary);
    }
  }, [bill]);

  if (loading) {
    return <Skeleton className="h-32 w-full bg-amber-200" />;
  }
  if (error) {
    return (
      <Card className="ghibli-shadow bg-red-50 border-red-200">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2 text-red-800">
            <AlertCircle className="w-5 h-5" />
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  if (!bill) return null;

  return (
    <div className="container mx-auto px-6 py-8">
      <Card className="ghibli-shadow bg-amber-50/80 border-amber-200/50 mb-8">
        <CardHeader>
          <CardTitle className="text-2xl text-amber-950">{bill.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <h3 className="font-semibold text-amber-900 mb-2">Official Summary</h3>
            <p className="text-amber-800 leading-relaxed">{bill.summary}</p>
          </div>
          <div className="mb-6">
            <h3 className="font-semibold text-amber-900 mb-2">Plain English Legal Translation</h3>
            {translating ? (
              <div className="flex items-center text-amber-700 italic"><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Translating...</div>
            ) : translationError ? (
              <div className="text-red-700 italic">{translationError}</div>
            ) : translation ? (
              <p className="text-amber-700 leading-relaxed italic">{translation}</p>
            ) : (
              <p className="text-amber-700 italic">No translation available.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 