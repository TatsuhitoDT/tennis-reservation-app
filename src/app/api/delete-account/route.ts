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
      console.log(`[アカウント削除] サービスロールキーが設定されています。ユーザー ${user.id} を完全に削除します。`)
      
      // Admin APIクライアントを作成
      const adminClient = createClient(supabaseUrl, serviceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      })
      
      // まず、関連データ（reservations、profiles）を削除
      // これにより、auth.users削除時の制約エラーを回避
      console.log(`[アカウント削除] 関連データを削除中...`)
      
      // 予約を削除
      const { error: reservationError, data: deletedReservations } = await adminClient
        .from('reservations')
        .delete()
        .eq('user_id', user.id)
        .select()
      
      if (reservationError) {
        console.error('[アカウント削除] 予約削除エラー:', reservationError)
        // 予約削除エラーは警告として記録するが、続行
        console.warn(`[アカウント削除] 予約削除でエラーが発生しましたが、続行します: ${reservationError.message}`)
      } else {
        console.log(`[アカウント削除] 予約データを削除しました（削除数: ${deletedReservations?.length || 0}）`)
      }
      
      // プロフィールを削除
      const { error: profileError, data: deletedProfiles } = await adminClient
        .from('profiles')
        .delete()
        .eq('id', user.id)
        .select()
      
      if (profileError) {
        console.error('[アカウント削除] プロフィール削除エラー:', profileError)
        // プロフィール削除エラーは警告として記録するが、続行
        console.warn(`[アカウント削除] プロフィール削除でエラーが発生しましたが、続行します: ${profileError.message}`)
      } else {
        console.log(`[アカウント削除] プロフィールデータを削除しました（削除数: ${deletedProfiles?.length || 0}）`)
      }
      
      // 最後に、auth.usersを削除
      console.log(`[アカウント削除] auth.usersを削除中...`)
      const { error: deleteError, data: deleteData } = await adminClient.auth.admin.deleteUser(user.id)
      
      if (deleteError) {
        console.error('[アカウント削除] ユーザー削除エラー詳細:', {
          message: deleteError.message,
          status: deleteError.status,
          name: deleteError.name,
          error: deleteError
        })
        return NextResponse.json(
          { 
            error: `アカウントの削除に失敗しました: ${deleteError.message}`,
            details: deleteError.status ? `ステータス: ${deleteError.status}` : undefined
          },
          { status: 500 }
        )
      }
      
      console.log(`[アカウント削除] ユーザー ${user.id} の削除を実行しました。削除を確認中...`)
      
      // 削除成功を確認（少し待ってから確認）
      await new Promise(resolve => setTimeout(resolve, 1000))
      const { data: deletedUser, error: verifyError } = await adminClient.auth.admin.getUserById(user.id)
      
      if (!verifyError && deletedUser?.user) {
        // まだユーザーが存在する場合は削除失敗
        console.error(`[アカウント削除] ユーザー ${user.id} がまだ存在します。`)
        return NextResponse.json(
          { error: 'アカウントの削除に失敗しました。ユーザーがまだ存在します。' },
          { status: 500 }
        )
      }
      
      console.log(`[アカウント削除] ユーザー ${user.id} の削除が完了しました。`)
    } else {
      // サービスロールキーがない場合、profilesとreservationsを手動で削除
      // 注意: auth.usersは削除されないため、同じメールアドレスで再登録できない
      console.warn(`[アカウント削除] 警告: SUPABASE_SERVICE_ROLE_KEYが設定されていません。`)
      console.warn(`[アカウント削除] ユーザー ${user.id} のprofilesとreservationsのみ削除します。auth.usersは削除されません。`)
      
      // まず予約を削除（profilesより先に削除する必要がある場合がある）
      console.log(`[アカウント削除] 予約データを削除中...`)
      const { data: deletedReservations, error: reservationError } = await supabase
        .from('reservations')
        .delete()
        .eq('user_id', user.id)
        .select()
      
      if (reservationError) {
        console.error('[アカウント削除] 予約削除エラー:', reservationError)
        return NextResponse.json(
          { error: `予約データの削除に失敗しました: ${reservationError.message}` },
          { status: 500 }
        )
      }
      console.log(`[アカウント削除] 予約データを削除しました（削除数: ${deletedReservations?.length || 0}）`)
      
      // 次にプロフィールを削除
      console.log(`[アカウント削除] プロフィールデータを削除中...`)
      const { data: deletedProfiles, error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id)
        .select()
      
      if (profileError) {
        console.error('[アカウント削除] プロフィール削除エラー:', profileError)
        return NextResponse.json(
          { error: `プロフィールデータの削除に失敗しました: ${profileError.message}` },
          { status: 500 }
        )
      }
      console.log(`[アカウント削除] プロフィールデータを削除しました（削除数: ${deletedProfiles?.length || 0}）`)
      
      // 削除を確認
      const { data: remainingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()
      
      if (remainingProfile) {
        console.error(`[アカウント削除] プロフィールがまだ存在します: ${remainingProfile.id}`)
        return NextResponse.json(
          { error: 'プロフィールの削除に失敗しました。データがまだ存在します。' },
          { status: 500 }
        )
      }
      
      // 警告: auth.usersは削除されないため、同じメールアドレスで再登録できない
      // 管理者がSupabaseダッシュボードから手動でauth.usersを削除する必要がある
      console.warn(`[アカウント削除] 完了: profilesとreservationsを削除しましたが、auth.usersは削除されません。`)
      console.warn(`[アカウント削除] 同じメールアドレスで再登録するには、Supabaseダッシュボードからauth.usersを手動で削除する必要があります。`)
      console.warn(`[アカウント削除] または、Vercelの環境変数にSUPABASE_SERVICE_ROLE_KEYを設定してください。`)
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
