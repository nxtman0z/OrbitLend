import LoanRequestForm from '../components/LoanRequestForm'
import UserLoanRequests from '../components/UserLoanRequests'

const LoansPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Loan Management</h1>
          <p className="text-gray-600 mt-2">
            Request new loans and manage your existing loan applications
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Loan Request Form */}
          <div>
            <LoanRequestForm />
          </div>

          {/* User Loan Requests */}
          <div>
            <UserLoanRequests />
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoansPage
