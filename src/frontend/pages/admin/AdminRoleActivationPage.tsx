import { useEffect, useState } from "react";
import { CheckCircle, XCircle, AlertCircle, RefreshCw, User, Clock, FileText } from "lucide-react";
import { adminService } from "@/backend/services/admin.service";
import { RoleActivationItem } from "@/backend/services/activation.service";
import { Button } from "@/frontend/components/ui/button";
import { ActivationConfirmModal } from "@/frontend/components/shared/ActivationConfirmModal";
import i18n from "@/frontend/i18n";

type FilterTab = "all" | "caregiver" | "agency" | "shop";

export default function AdminRoleActivationPage() {
  const [activations, setActivations] = useState<RoleActivationItem[]>([]);
  const [filteredActivations, setFilteredActivations] = useState<RoleActivationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [selectedItem, setSelectedItem] = useState<RoleActivationItem | null>(null);
  const [modalState, setModalState] = useState<{ isOpen: boolean; type: "approve" | "reject"; item: RoleActivationItem | null }>({
    isOpen: false,
    type: "approve",
    item: null,
  });

  const loadData = async () => {
    setIsLoading(true);
    setError("");
    try {
      const pending = await adminService.getPendingActivations();
      setActivations(pending || []);
    } catch (e: any) {
      setError(e.message || i18n.t("activation.admin.loadError", { ns: "common" }));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (activeTab === "all") {
      setFilteredActivations(activations);
    } else {
      setFilteredActivations(activations.filter((a) => a.role === activeTab));
    }
  }, [activations, activeTab]);

  const handleApprove = async (note?: string) => {
    if (!modalState.item) return;
    try {
      await adminService.approveActivation(modalState.item.id, "Admin", note);
      await loadData();
      setModalState({ isOpen: false, type: "approve", item: null });
    } catch (e: any) {
      setError(e.message || i18n.t("activation.admin.approveError", { ns: "common" }));
    }
  };

  const handleReject = async (note: string) => {
    if (!modalState.item) return;
    try {
      await adminService.rejectActivation(modalState.item.id, "Admin", note);
      await loadData();
      setModalState({ isOpen: false, type: "reject", item: null });
    } catch (e: any) {
      setError(e.message || i18n.t("activation.admin.rejectError", { ns: "common" }));
    }
  };

  const openApproveModal = (item: RoleActivationItem) => {
    setModalState({ isOpen: true, type: "approve", item });
  };

  const openRejectModal = (item: RoleActivationItem) => {
    setModalState({ isOpen: true, type: "reject", item });
  };

  const stats = {
    all: activations.length,
    caregiver: activations.filter((a) => a.role === "caregiver").length,
    agency: activations.filter((a) => a.role === "agency").length,
    shop: activations.filter((a) => a.role === "shop").length,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{i18n.t("activation.admin.title", { ns: "common" })}</h1>
        <Button variant="outline" onClick={loadData} disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          {i18n.t("common.refresh", { ns: "common" })}
        </Button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-gray-900">{stats.all}</div>
          <div className="text-sm text-gray-500">{i18n.t("activation.admin.allPending", { ns: "common" })}</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-blue-600">{stats.caregiver}</div>
          <div className="text-sm text-gray-500">{i18n.t("activation.admin.caregivers", { ns: "common" })}</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-purple-600">{stats.agency}</div>
          <div className="text-sm text-gray-500">{i18n.t("activation.admin.agencies", { ns: "common" })}</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-green-600">{stats.shop}</div>
          <div className="text-sm text-gray-500">{i18n.t("activation.admin.shops", { ns: "common" })}</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-2 mb-6">
        {(["all", "caregiver", "agency", "shop"] as FilterTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === tab
                ? "bg-[#1A1A1A] text-white"
                : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            {tab === "all"
              ? i18n.t("activation.admin.all", { ns: "common" })
              : tab.charAt(0).toUpperCase() + tab.slice(1)}
            {stats[tab as keyof typeof stats] > 0 && (
              <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                {stats[tab as keyof typeof stats]}
              </span>
            )}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg flex items-center" role="alert">
          <AlertCircle className="w-5 h-5 mr-2 shrink-0" />
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#FEB4C5", borderTopColor: "transparent" }} />
        </div>
      ) : filteredActivations.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-lg border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-2">{i18n.t("activation.admin.noPending", { ns: "common" })}</h3>
          <p className="text-gray-500">{i18n.t("activation.admin.allCaughtUp", { ns: "common" })}</p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md border border-gray-200">
          <ul className="divide-y divide-gray-200">
            {filteredActivations.map((item) => (
              <li key={item.id} className="px-6 py-4 hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedItem(item)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-gray-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{item.name}</h3>
                      <div className="mt-1 flex items-center text-sm text-gray-500 space-x-4">
                        <span>{item.email}</span>
                        <span>•</span>
                        <span className="capitalize">{item.role.replace('_', ' ')}</span>
                        <span>•</span>
                        <Clock className="w-4 h-4" />
                        <span>{new Date(item.registeredAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-3" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="outline"
                      className="text-green-600 border-green-200 hover:bg-green-50"
                      onClick={() => openApproveModal(item)}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      {i18n.t("activation.admin.approve", { ns: "common" })}
                    </Button>
                    <Button
                      variant="outline"
                      className="text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => openRejectModal(item)}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      {i18n.t("activation.admin.reject", { ns: "common" })}
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Profile Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" role="dialog" aria-modal="true">
          <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-xl font-bold text-gray-900">{i18n.t("activation.admin.profileDetail", { ns: "common" })}</h2>
              <button onClick={() => setSelectedItem(null)} className="text-gray-400 hover:text-gray-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                  <User className="w-8 h-8 text-gray-500" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{selectedItem.name}</h3>
                  <p className="text-sm text-gray-500">{selectedItem.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">{i18n.t("activation.admin.role", { ns: "common" })}</label>
                  <p className="mt-1 capitalize">{selectedItem.role.replace('_', ' ')}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">{i18n.t("activation.admin.registered", { ns: "common" })}</label>
                  <p className="mt-1">{new Date(selectedItem.registeredAt).toLocaleString()}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">{i18n.t("activation.admin.auditLog", { ns: "common" })}</label>
                <div className="mt-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-500">{i18n.t("activation.admin.noHistory", { ns: "common" })}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Activation Confirm Modal */}
      <ActivationConfirmModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ isOpen: false, type: "approve", item: null })}
        onConfirm={modalState.type === "approve" ? handleApprove : handleReject}
        type={modalState.type}
        userName={modalState.item?.name}
        userRole={modalState.item?.role}
      />
    </div>
  );
}
