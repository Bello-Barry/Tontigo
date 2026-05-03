'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { serviceClient } from '@/lib/supabase/service'
import type { ActionResult } from '@/lib/types'
import { generateText } from 'ai'
import { google } from '@ai-sdk/google'

export interface AIInsight {
  id: string
  title: string
  content: string
  type: 'tip' | 'milestone' | 'alert'
  icon?: string
}

export interface AIConversation {
  id: string
  title: string
  updated_at: string
}

export interface AIMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export async function saveAIConversation(
  conversationId: string | null,
  userMessage: string,
  aiReply: string
): Promise<ActionResult<{ conversationId: string }>> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  let targetId = conversationId

  if (!targetId) {
    // Créer une nouvelle conversation
    const title = userMessage.slice(0, 50) + (userMessage.length > 50 ? '...' : '')
    const { data, error } = await serviceClient
      .from('ai_conversations')
      .insert({
        user_id: user.id,
        title: title,
      })
      .select('id')
      .single()

    if (error) return { error: error.message }
    targetId = data.id
  }

  // Sauvegarder les nouveaux messages
  const messagesToInsert = [
    { conversation_id: targetId, role: 'user', content: userMessage },
    { conversation_id: targetId, role: 'assistant', content: aiReply },
  ]

  const { error: msgError } = await serviceClient
    .from('ai_messages')
    .insert(messagesToInsert)

  if (msgError) return { error: msgError.message }

  // Mettre à jour la date de modification
  await serviceClient
    .from('ai_conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', targetId)

  return { data: { conversationId: targetId! }, success: true }
}

export async function getAIConversations(): Promise<ActionResult<AIConversation[]>> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const { data, error } = await supabase
    .from('ai_conversations')
    .select('id, title, updated_at')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  if (error) return { error: error.message }
  return { data: data as AIConversation[], success: true }
}

export async function loadAIConversation(
  conversationId: string
): Promise<ActionResult<{ messages: AIMessage[] }>> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const { data: conversation } = await supabase
    .from('ai_conversations')
    .select('id')
    .eq('id', conversationId)
    .eq('user_id', user.id)
    .single()

  if (!conversation) return { error: 'Conversation non trouvée' }

  const { data: messages, error } = await supabase
    .from('ai_messages')
    .select('role, content')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

  if (error) return { error: error.message }
  return { data: { messages: messages as AIMessage[] }, success: true }
}

export async function deleteAIConversation(
  conversationId: string
): Promise<ActionResult> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const { error } = await supabase
    .from('ai_conversations')
    .delete()
    .eq('id', conversationId)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  return { success: true }
}

export async function deleteAllAIConversations(): Promise<ActionResult> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const { error } = await supabase
    .from('ai_conversations')
    .delete()
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  return { success: true }
}

export async function getDashboardInsights(): Promise<ActionResult<AIInsight[]>> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  // 1. Récupérer les données critiques
  const [profileRes, walletRes, transRes] = await Promise.all([
    supabase.from('users').select('*').eq('id', user.id).single(),
    supabase.from('virtual_wallet').select('*').eq('user_id', user.id).single(),
    supabase.from('transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5)
  ])

  const profile = profileRes.data
  const wallet = walletRes.data
  const transactions = transRes.data || []

  // 2. Préparer le prompt pour Gemini
  const prompt = `Analyse les données financières suivantes d'un utilisateur de Likelemba (plateforme d'épargne) et génère exactement 3 conseils/insights courts (max 15 mots par conseil).
  
  Données :
  - Trust Score: ${profile?.trust_score}/100
  - Badge: ${profile?.badge}
  - Solde Portefeuille: ${wallet?.total_balance} FCFA
  - Dernières transactions: ${transactions.map(t => `${t.type}: ${t.amount}`).join(', ')}

  Génère une réponse JSON valide au format suivant : 
  [
    {"id": "1", "title": "...", "content": "...", "type": "tip|milestone|alert", "icon": "lucide-icon-name"}
  ]
  Les types : 'tip' (conseil), 'milestone' (succès/badge), 'alert' (danger/attention).
  Réponds UNIQUEMENT le JSON.`

  try {
    const { text } = await generateText({
      model: google('gemini-2.0-flash'),
      prompt: prompt,
    })

    // Nettoyer la réponse si l'IA ajoute des blocs de code markdown
    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim()
    const insights = JSON.parse(jsonStr) as AIInsight[]

    return { data: insights, success: true }
  } catch (error) {
    console.error('Erreur Insights IA:', error)
    // Fallback static en cas d'erreur
    return { 
      data: [
        { id: 'f1', title: 'Astuce du jour', content: 'Économisez 10% de vos gains tontine dans un coffre bloqué.', type: 'tip' },
        { id: 'f2', title: 'Objectif Badge', content: 'Complétez une autre tontine pour passer au badge Expert !', type: 'milestone' }
      ], 
      success: true 
    }
  }
}
