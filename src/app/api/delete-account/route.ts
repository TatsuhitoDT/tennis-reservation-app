import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // リクエストボディからユーザーIDとアクセストークンを取得
    const body = await request.json()
    const { userId, accessToken } = body

    if (!userId || !accessToken) {
      return NextResponse.json(
        { error: 'ユーザーIDとアクセストークンが必要です' },
        { status: 400 }
      )
    }

    // ユーザー認証を確認
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: 'Supabase設定が不完全です' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    
    // トークンからユーザー情報を取得して検証
    const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken)
    
    if (userError || !user) {
      return NextResponse.json(
        { error: '認証に失敗しました。ログインしてください。' },
        { status: 401 }
      )
    }

    // リクエストのuserIdと認証されたユーザーIDが一致するか確認
    if (user.id !== userId) {
      return NextResponse.json(
        { error: '認証エラー：ユーザーIDが一致しません' },
        { status: 403 }
      )
    }

    // サービスロールキーがある場合は、Admin APIでユーザーを削除
    // ない場合は、profilesとreservationsのみ削除（auth.usersは管理者が削除）
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (serviceRoleKey) {
      // Admin APIを使用してユーザーを完全に削除
      const adminClient = createClient(supabaseUrl, serviceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      })
      
      const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id)
      
      if (deleteError) {
        console.error('ユーザー削除エラー:', deleteError)
        return NextResponse.json(
          { error: 'アカウントの削除に失敗しました' },
          { status: 500 }
        )
      }
    } else {
      // サービスロールキーがない場合、profilesとreservationsのみ削除
      // auth.usersはCASCADEで自動削除される可能性があるが、確実ではない
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id)
      
      if (profileError) {
        console.error('プロフィール削除エラー:', profileError)
      }
      
      const { error: reservationError } = await supabase
        .from('reservations')
        .delete()
        .eq('user_id', user.id)
      
      if (reservationError) {
        console.error('予約削除エラー:', reservationError)
      }
      
      // auth.usersの削除は管理者に依頼する必要がある
      console.warn('サービスロールキーが設定されていないため、auth.usersは削除されません。管理者に依頼してください。')
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('アカウント削除エラー:', error)
    return NextResponse.json(
      { error: error.message || 'アカウントの削除に失敗しました' },
      { status: 500 }
    )
  }
}
