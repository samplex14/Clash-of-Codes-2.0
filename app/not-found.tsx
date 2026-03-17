import Link from "next/link";

const NotFoundPage = (): JSX.Element => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh]">
      <div className="card-clash max-w-md w-full text-center">
        <h2 className="text-4xl font-clash text-clash-red mb-4">404</h2>
        <p className="text-white text-lg mb-8">This territory is unexplored.</p>
        <Link href="/" className="btn-clash px-6">
          Return to Village
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
