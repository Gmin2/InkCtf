# Level Complete: Instance

Congratulations! You've completed your first ink! security challenge.

---

## What You Learned

You discovered that **marking a function as public exposes it to everyone**. The developer made a critical mistake by creating a public getter for the password.

In ink!, any function with `#[ink(message)]` can be called by any external account or contract. There is no concept of "internal only" message functions - if it's a message, it's public.

---

## Key Takeaways

1. **Review all public functions** - Every `#[ink(message)]` function is part of your attack surface
2. **Sensitive data needs protection** - Never expose secrets through public getters
3. **Think like an attacker** - Always ask "what if someone calls this function maliciously?"

---

## Secure Pattern

```rust
// BAD: Password is exposed
#[ink(message)]
pub fn get_password(&self) -> String {
    self.password.clone()
}

// GOOD: No getter for sensitive data
// Only store hashed passwords, never plaintext
#[ink(message)]
pub fn authenticate(&mut self, password: String) {
    let hash = self.hash(password);
    if hash == self.password_hash {
        self.cleared = true;
    }
}
```

---

## Real World Impact

This might seem trivial, but similar mistakes have led to real exploits:
- Contracts exposing admin keys through debug functions
- "Private" configuration values being readable
- Test functions left in production code

**Always audit every public function before deployment!**

---

Ready for the next challenge? Move on to **Fallback** to learn about ownership vulnerabilities!
