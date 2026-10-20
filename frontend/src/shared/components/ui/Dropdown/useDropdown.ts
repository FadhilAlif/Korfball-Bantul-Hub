import {
  flip,
  offset,
  type Placement,
  shift,
  useClick,
  useDismiss,
  useFloating,
  useInteractions,
  useRole,
} from "@floating-ui/react";
import { useState } from "react";

interface Params {
  placement?: Placement;
  offsetPx?: number;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const useDropdown = ({
  placement,
  offsetPx,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: Params) => {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;

  const handleOpenChange = (nextOpen: boolean) => {
    if (!isControlled) {
      setUncontrolledOpen(nextOpen);
    }
    controlledOnOpenChange?.(nextOpen);
  };

  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: handleOpenChange,
    placement,
    middleware: [offset(offsetPx), flip(), shift({ padding: 8 })],
  });

  const click = useClick(context);
  const dismiss = useDismiss(context);
  const role = useRole(context);

  const { getReferenceProps, getFloatingProps } = useInteractions([click, dismiss, role]);

  return {
    open,
    setOpen: handleOpenChange,
    refs,
    floatingStyles,
    getReferenceProps,
    getFloatingProps,
  };
};
