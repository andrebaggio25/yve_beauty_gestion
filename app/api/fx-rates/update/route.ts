import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getExchangeRates } from '@/modules/integrations/currency-api'

/**
 * API Route para atualizar taxas de câmbio
 * 
 * Atualiza taxas EUR-USD e BRL-USD na tabela fx_rate
 * 
 * Pode ser chamada:
 * - Manualmente via GET/POST
 * - Por cronjob externo (ex: cron-job.org)
 * - Por Vercel Cron (vercel.json)
 * 
 * Horário recomendado: 10h da manhã (BR) = 13:00 UTC
 */
export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient()
    const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD

    // Verificar se já atualizou hoje
    const { data: existingRates } = await supabase
      .from('fx_rate')
      .select('date, base, quote')
      .eq('date', today)
      .in('base', ['EUR', 'BRL'])
      .eq('quote', 'USD')

    // Se já tem taxas de hoje, retornar status
    if (existingRates && existingRates.length >= 2) {
      return NextResponse.json({
        success: true,
        message: 'Taxas já atualizadas hoje',
        date: today,
        rates: existingRates,
      })
    }

    // Buscar taxas atualizadas da API
    const rates = await getExchangeRates('USD')

    if (!rates || !rates.EUR || !rates.BRL) {
      return NextResponse.json(
        { success: false, error: 'Não foi possível obter taxas da API' },
        { status: 500 }
      )
    }

    // A API retorna taxas onde USD é base (ex: rates.EUR = quantos EUR para 1 USD)
    // Precisamos converter para EUR/USD e BRL/USD
    // Se rates.EUR = 0.92, significa que 1 USD = 0.92 EUR, então 1 EUR = 1/0.92 USD
    const eurToUsd = 1 / rates.EUR
    const brlToUsd = 1 / rates.BRL

    // Salvar taxas na tabela fx_rate
    // Estrutura: date, base, quote, rate
    // base é a moeda de origem, quote é a moeda de destino (sempre USD)
    const ratesToInsert = [
      {
        date: today,
        base: 'EUR',
        quote: 'USD',
        rate: eurToUsd,
        provider: 'exchangerate-api.com',
      },
      {
        date: today,
        base: 'BRL',
        quote: 'USD',
        rate: brlToUsd,
        provider: 'exchangerate-api.com',
      },
    ]

    const { error: insertError } = await supabase
      .from('fx_rate')
      .upsert(ratesToInsert, {
        onConflict: 'date,base,quote',
      })

    if (insertError) {
      console.error('Error inserting rates:', insertError)
      return NextResponse.json(
        { success: false, error: 'Erro ao salvar taxas no banco', details: insertError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Taxas atualizadas com sucesso',
      date: today,
      rates: {
        EUR: eurToUsd,
        BRL: brlToUsd,
      },
    })
  } catch (error) {
    console.error('Error updating FX rates:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao atualizar taxas', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// Também permitir POST
export const POST = GET

