import Dashboard from '../components/Dashboard'

/**
 * DashboardPage - Page wrapper component that renders the main Dashboard.
 * 
 * @param {Object} props - Component props
 * @returns {JSX.Element} Rendered component
 */
function DashboardPage({ userId, userName }) {
  return <Dashboard userId={userId} userName={userName} />
}

export default DashboardPage
