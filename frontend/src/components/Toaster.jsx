import toast, { Toaster } from "react-hot-toast";

export const showToast = (message, type = "success") => {
  switch (type) {
    case "success":
      toast.success(message);
      break;
    case "error":
      toast.error(message);
      break;
    case "loading":
      toast.loading(message, { id: "loading" });
      break;
    case "dismiss":
      toast.dismiss("loading");
      break;
    default:
      toast(message);
  }
};

export default Toaster;
