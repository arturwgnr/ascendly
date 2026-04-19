import Sidebar from './Sidebar';
import TopBar from './TopBar';
import '../../styles/layout.css';

export default function Layout({ title, children }) {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-area">
        <TopBar title={title} />
        <main className="page-content">{children}</main>
      </div>
    </div>
  );
}
