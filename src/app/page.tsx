import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex flex-col items-center py-12 text-center sm:py-20">
      <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
        Uni Match SG
      </h1>
      <p className="mt-4 max-w-xl text-lg text-gray-600">
        Calculate your UAS and explore courses at NUS, NTU, and SMU that match
        your A Level results and interests.
      </p>

      <div className="mt-10 flex flex-col gap-4 sm:flex-row">
        <Link href="/results-input" className="btn-primary text-base px-8 py-3">
          Enter Your Results
        </Link>
        <Link href="/quiz" className="btn-secondary text-base px-8 py-3">
          Take the Interests Quiz
        </Link>
      </div>

      <section className="mt-16 grid w-full max-w-3xl gap-6 sm:grid-cols-3">
        <div className="card text-left">
          <h3 className="font-semibold text-gray-900">Step 1</h3>
          <p className="mt-1 text-sm text-gray-600">
            Enter your A Level subjects and grades to calculate your UAS
            (University Admission Score) on the 70-point scale.
          </p>
        </div>
        <div className="card text-left">
          <h3 className="font-semibold text-gray-900">Step 2</h3>
          <p className="mt-1 text-sm text-gray-600">
            Take a short interests quiz and university style quiz to discover
            what courses and learning environments suit you best.
          </p>
        </div>
        <div className="card text-left">
          <h3 className="font-semibold text-gray-900">Step 3</h3>
          <p className="mt-1 text-sm text-gray-600">
            Get personalised course recommendations ranked by eligibility,
            interest fit, and admission chances.
          </p>
        </div>
      </section>

      <p className="mt-12 max-w-lg text-xs text-gray-400">
        This tool provides estimates only. Please refer to official university
        websites (NUS, NTU, SMU) for the most accurate admission information.
      </p>
    </div>
  );
}
