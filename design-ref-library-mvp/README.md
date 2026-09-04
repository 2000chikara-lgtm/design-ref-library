# 参考画像ライブラリ（MVP / STEP3実装）

自分専用のデザイン参考画像管理ツールです。構成・仕様の全体像は、別途お渡しした「参考画像ライブラリ設計書」を参照してください。ここでは動かすための手順のみをまとめます。

技術構成: Next.js 14 (App Router) / Supabase (Postgres + Auth + Storage) / Vercel

---

## 1. Supabaseプロジェクトを作る

1. https://supabase.com でプロジェクトを新規作成（Free プラン）
2. 左メニュー **SQL Editor** を開き、`supabase/migrations/0001_init.sql` の中身を全部貼り付けて実行
   - テーブル・RLSポリシー・Storageバケット・初期フォルダ作成トリガーがすべて設定されます
3. 左メニュー **Authentication → Users → Add user** で、自分用のアカウントを1つ作成
   - 「Auto Confirm User」にチェックを入れてください（メール確認なしですぐ使えます）
   - このタイミングで裏側のトリガーが動き、「未分類」「FV」「見出し」などの初期フォルダが自動的に作成されます

## 2. 環境変数を設定する

`.env.local.example` を `.env.local` にコピーし、Supabase の **Project Settings → API** に表示されている値を入れてください。

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxxxxx
```

## 3. ローカルで動作確認

```bash
npm install
npm run dev
```

http://localhost:3000 を開き、手順1で作成したメールアドレス・パスワードでログインできれば成功です。

## 4. Vercelへデプロイ

1. このフォルダをGitHubリポジトリにpush
2. https://vercel.com で「Add New → Project」からそのリポジトリをインポート
3. Environment Variables に、`.env.local` と同じ2つの値を登録（Production / Preview 両方）
4. Deploy
5. デプロイ後のURLにアクセスし、ログインできることを確認

Vercel Hobby（無料）プランは個人・非商用利用が条件です。本ツールは自分専用の利用のため問題ありません。

## 5. iPhoneでホーム画面に追加する（PWA）

1. iPhoneのSafariでデプロイ後のURLを開く
2. 共有ボタン（□に↑のアイコン）をタップ
3. 「ホーム画面に追加」を選択
4. 追加後はアイコンからアプリのように起動します（アドレスバーなしの全画面表示）

## 6. 動作確認チェックリスト（STEP4）

- [ ] PC: ログイン
- [ ] PC: ドラッグ&ドロップで複数画像を保存
- [ ] PC: ファイル選択で保存
- [ ] PC: 画像URLを貼り付けて保存
- [ ] PC: 画面上でCtrl/Cmd+Vで画像を貼り付けて保存
- [ ] PC: フォルダの追加・名前変更・削除
- [ ] PC: 画像のフォルダ移動
- [ ] PC: タグ追加・削除、タグクリックでの絞り込み
- [ ] PC: 検索（例: `医療 赤 権威` で複数キーワードのAND検索）
- [ ] PC: メモの編集
- [ ] PC: 画像の削除
- [ ] iPhone Safari: 写真ライブラリから複数選択して保存
- [ ] iPhone Safari: スクリーンショットの保存
- [ ] iPhone: ホーム画面追加後、PWAとして起動
- [ ] iPhone: ボトムナビ・「＋保存」ボタンの操作性

## 今後のステップ

- **STEP5**: iPhoneの共有シートからワンタップで保存できるよう、iOSショートカット連携を追加します（作り方の解説つき）
- **STEP6**: 必要であれば、画像解析によるフォルダ・タグの自動判定（AI機能）を追加します

## 無料枠に関する注意

Supabase Storageの無料枠は1GBです。アップロード時にサムネイルをWebP圧縮していますが、元画像自体は圧縮していないため、保存量が多くなってきたら容量にご注意ください（目安・対策は設計書に記載しています）。
