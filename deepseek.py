import os, requests, sys

api_key = os.getenv("DEEPSEEK_API_KEY")
url = "https://api.deepseek.com/v1/chat/completions"

def ask_deepseek(prompt):
    headers = {"Authorization": f"Bearer {api_key}"}
    data = {"model": "deepseek-chat", "messages": [{"role": "user", "content": prompt}]}
    response = requests.post(url, headers=headers, json=data)
    return response.json()["choices"][0]["message"]["content"]

if __name__ == "__main__":
    prompt = " ".join(sys.argv[1:]) or "Hello DeepSeek!"
    print(ask_deepseek(prompt))
