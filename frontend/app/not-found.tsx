import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4"
    style={{
      backgroundImage:'linear-gradient(#9ca3af 5%, #ECFDF5 70% )'
    }}
    >
      <div className="text-center">
        <p className="text-8xl font-black mb-4"
           style={{
                   margin:'5% 5%',
                   padding:'1% 1%',
                   color:'#1e40ef',
                   fontStyle: 'revert-layer'
           }}>
          404
        </p>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Page not found</h1>
        <p className="text-gray-500 mb-8"
         style={{
                   margin:'5% 5%',
                   padding:'1% 1%',
                  //  color:'blue'
           }}>
          {"The page you're looking for doesn't exist or has been moved."}
        </p>
        <Link href="/"
          className="inline-block px-6 py-3 text-white font-semibold rounded-xl text-sm"
          style={{ 
                  padding:'2% 2%',
                  color:'white',
                  background: '#191970', 
                  boxShadow:'green 16px'}}>
          Back to home
        </Link>
      </div>
    </div>
  );
}
