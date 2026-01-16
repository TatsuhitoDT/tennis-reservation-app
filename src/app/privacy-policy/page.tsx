import Header from "@/components/Header";
import Link from "next/link";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="card">
          <h1 className="text-3xl font-bold text-primary mb-8">プライバシーポリシー</h1>
          
          <div className="prose prose-lg max-w-none text-on-background">
            <p className="mb-6">
              アイパークインスティチュート株式会社（以下、「当社」という。）は、個人情報の重要性を認識し、以下の方針に基づき、個人情報の保護に努めます。
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-primary mb-4">1. 個人情報の取得について</h2>
              <p>
                当社は、適法かつ公正な手段によって、個人情報を取得します。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-primary mb-4">2. 個人情報の利用について</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>当社は、あらかじめ通知または公表した利用目的の範囲内で個人情報を利用します。</li>
                <li>当社は、個人データの取扱いを委託する場合には、個人データの安全管理が図られるよう、委託先を厳正に調査・選定し、必要かつ適切な監督を行います。</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-primary mb-4">3. 個人データの第三者提供について</h2>
              <p>
                当社は、法令に定める場合を除き、あらかじめ本人の同意を得ることなく、個人データを第三者に提供しません。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-primary mb-4">4. 個人データの管理について</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>当社は、利用目的の達成に必要な範囲内において、個人データの正確性を保ち、これを安全に管理します。</li>
                <li>当社は、個人データの紛失、破壊、改ざん、漏えい等を防止するため、不正アクセス等に対する合理的な情報セキュリティ対策を講じます。</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-primary mb-4">5. 保有個人データの開示等について</h2>
              <p>
                当社は、本人より、自己の保有個人データについて、開示、訂正、利用停止等の求めがある場合には、法令に従い、適切に対応します。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-primary mb-4">6. 個人情報保護管理体制について</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>当社は、法務担当、ＩＴ担当等からなる個人情報保護管理体制を適切に運営します。</li>
                <li>当社は、従業員に対し、個人情報の保護および適正な管理方法について、教育を実施し、必要かつ適切な監督を行います。</li>
              </ul>
            </section>

            <div className="mt-8 pt-6 border-t border-outline/20">
              <p className="text-sm text-on-background/70 mb-2">
                本プライバシーポリシーは、<Link href="https://www.shonan-ipark.com/privacy-policy/" target="_blank" rel="noopener noreferrer" className="text-primary-accent hover:underline">湘南ヘルスイノベーションパーク（湘南アイパーク）のプライバシーポリシー</Link>に基づいています。
              </p>
              <p className="text-sm text-on-background/70">
                運営会社: アイパークインスティチュート株式会社 (iPark Institute Co., Ltd.)
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
