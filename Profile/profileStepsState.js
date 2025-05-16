// profileStepsState.js

// For demonstration, we store the steps in a simple in-memory array:
let profileSteps = [
  { title: "Your date preferences", count: 2 },
  { title: "A few more details about you", count: 8 },
  { title: "Profile bio", count: 1 },
  { title: "Verify your account", count: 2 },
];

// Expose getters and setters
export function getProfileSteps() {
  return profileSteps;
}

export function setProfileSteps(newSteps) {
  profileSteps = newSteps;
}

// Decrement the “count” for a given index and remove if zero
export function decrementStepCount(stepIndex) {
  const newSteps = [...profileSteps];
  if (!newSteps[stepIndex]) return;

  newSteps[stepIndex].count -= 1;
  if (newSteps[stepIndex].count <= 0) {
    newSteps.splice(stepIndex, 1);
  }

  profileSteps = newSteps;
}

// Compute a rough completion
export function getProfileCompletion() {
  if (profileSteps.length === 0) return 100;
  return 80; // or your own logic
}
