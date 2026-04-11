export const GUEST_SPIN_STORAGE_KEY = 'guest_spin_used';

export const hasGuestSpinUsed = () => {
  try {
    return localStorage.getItem(GUEST_SPIN_STORAGE_KEY) === 'true';
  } catch (error) {
    console.warn('Failed to read guest spin state', error);
    return false;
  }
};

export const markGuestSpinUsed = () => {
  try {
    localStorage.setItem(GUEST_SPIN_STORAGE_KEY, 'true');
  } catch (error) {
    console.warn('Failed to persist guest spin state', error);
  }
};
