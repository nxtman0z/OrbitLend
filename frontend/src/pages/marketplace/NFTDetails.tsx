import { useParams } from 'react-router-dom'

const NFTDetails = () => {
  const { id } = useParams<{ id: string }>()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">NFT Details</h1>
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">NFT ID: {id}</h3>
        </div>
        <div className="p-6">
          <p className="text-gray-600">NFT details coming soon!</p>
        </div>
      </div>
    </div>
  )
}

export default NFTDetails
