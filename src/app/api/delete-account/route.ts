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
      // auth.usersを削除すると、CASCADEでprofilesとreservationsも自動削除される
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
          { error: `アカウントの削除に失敗しました: ${deleteError.message}` },
          { status: 500 }
        )
      }
      
      // 削除成功を確認
      const { data: deletedUser, error: verifyError } = await adminClient.auth.admin.getUserById(user.id)
      if (!verifyError && deletedUser?.user) {
        // まだユーザーが存在する場合は削除失敗
        return NextResponse.json(
          { error: 'アカウントの削除に失敗しました。ユーザーがまだ存在します。' },
          { status: 500 }
        )
      }
    } else {
      // サービスロールキーがない場合、profilesとreservationsを手動で削除
      // 注意: auth.usersは削除されないため、同じメールアドレスで再登録できない
      
      // まず予約を削除（profilesより先に削除する必要がある場合がある）
      const { error: reservationError } = await supabase
        .from('reservations')
        .delete()
        .eq('user_id', user.id)
      
      if (reservationError) {
        console.error('予約削除エラー:', reservationError)
        return NextResponse.json(
          { error: `予約データの削除に失敗しました: ${reservationError.message}` },
          { status: 500 }
        )
      }
      
      // 次にプロフィールを削除
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id)
      
      if (profileError) {
        console.error('プロフィール削除エラー:', profileError)
        return NextResponse.json(
          { error: `プロフィールデータの削除に失敗しました: ${profileError.message}` },
          { status: 500 }
        )
      }
      
      // 削除を確認
      const { data: remainingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()
      
      if (remainingProfile) {
        return NextResponse.json(
          { error: 'プロフィールの削除に失敗しました。データがまだ存在します。' },
          { status: 500 }
        )
      }
      
      // 警告: auth.usersは削除されないため、同じメールアドレスで再登録できない
      // 管理者がSupabaseダッシュボードから手動でauth.usersを削除する必要がある
      console.warn(`ユーザー ${user.id} のprofilesとreservationsを削除しましたが、auth.usersは削除されません。`)
      console.warn('同じメールアドレスで再登録するには、Supabaseダッシュボードからauth.usersを手動で削除する必要があります。')
      console.warn('または、Vercelの環境変数にSUPABASE_SERVICE_ROLE_KEYを設定してください。')
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
