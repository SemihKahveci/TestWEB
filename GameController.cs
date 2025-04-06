using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using UnityEngine.Networking;
using System;


public class GameController : MonoBehaviour
{

    [Serializable]
    public class GameResult
    {
        public string playerCode;
        public string section;
        public List<AnswerData> answers;
    }

    [Serializable]
    public class AnswerData
    {
        public string questionId;
        public string planetName;
        public string questionText;
        public string selectedAnswer1;
        public string selectedAnswer2;
        public string answerType1;
        public string answerType2;
        public string answerSubCategory;
    }

    [Serializable]
    public class CodeRequest
    {
        public string code;
    }

    [Serializable]
    public class CodeResponse
    {
        public bool success;
        public string message;
        public Section[] sections;
    }

    [Serializable]
    public class Section
    {
        public string name;
    }

    [Header("UI Elements")]
    public Button sendResultButton;
    public InputField codeInputField;
    public Button verifyCodeButton;
    public Text statusText;

    private List<AnswerData> playerAnswers;
    private string gameCode = "";
    private bool isCodeVerified = false;
    private const string SERVER_URL_ = "http://localhost:5000";
    private const string SERVER_URL = "https://adminpaneli-e8ec7b2d1ed5.herokuapp.com";

    void Start()
    {
        playerAnswers = new List<AnswerData>();
        InitializeAnswers();
        string[] asd = null;
        string asdd = null;
        if (verifyCodeButton != null)

            verifyCodeButton.onClick.AddListener(() => { asd = VerifyCode(codeInputField.text); Debug.Log("Bolumler " + asd); });
        Debug.Log(asd);
        if (sendResultButton != null)
        {
            sendResultButton.onClick.AddListener(() => { asdd = SendDataToServer(playerAnswers); Debug.Log("Mesaj " + asdd); });
            Debug.Log(asdd);
            sendResultButton.interactable = false;
        }
    }

    public void AddAnswer(string questionId, string planetName, string questionText,
        string selectedAnswer1, string selectedAnswer2,
        string answerType1, string answerType2,
        string answerSubCategory)
    {
        AnswerData newAnswer = new AnswerData
        {
            questionId = questionId,
            planetName = planetName,
            questionText = questionText,
            selectedAnswer1 = selectedAnswer1,
            selectedAnswer2 = selectedAnswer2,
            answerType1 = answerType1,
            answerType2 = answerType2,
            answerSubCategory = answerSubCategory
        };
        playerAnswers.Add(newAnswer);
    }

    private void InitializeAnswers()
    {
        // Örnek cevaplar
        AddAnswer("Q2_3", "Mars", "Mars sorusu", "A", "B", "AKY", "CY", "MO");
        AddAnswer("Q2_4", "Venüs", "Venüs sorusu", "B", "C", "CY", "Y", "BY");
        AddAnswer("Q2_11", "Jüpiter", "Jüpiter sorusu", "C", "D", "Y", "AY", "MO");
    }
    public string[] VerifyCode(string code)
    {
        if (string.IsNullOrEmpty(code))
        {
            UpdateStatus("Lutfen bir kod girin!");
            return null;
        }

        // Kodu temizle
        gameCode = code.Trim();
        Debug.Log($"Gonderilen kod (temizlenmiş): '{gameCode}'");
        Debug.Log($"Kod uzunluğu: {gameCode.Length}");

        var requestData = new CodeRequest { code = gameCode };
        string jsonData = JsonUtility.ToJson(requestData, true);
        Debug.Log($"Gonderilen JSON: {jsonData}");

        byte[] bodyRaw = System.Text.Encoding.UTF8.GetBytes(jsonData);
        Debug.Log($"Request body uzunluğu: {bodyRaw.Length}");

        using (UnityWebRequest request = UnityWebRequest.PostWwwForm($"{SERVER_URL}/api/verify-code", ""))
        {
            request.SetRequestHeader("Content-Type", "application/json");
            request.uploadHandler = new UploadHandlerRaw(bodyRaw);

            Debug.Log($"Request URL: {request.url}");
            Debug.Log($"Request Headers: {request.GetRequestHeader("Content-Type")}");

            var operation = request.SendWebRequest();

            // İşlemin tamamlanmasını bekle
            while (!operation.isDone)
            {
                System.Threading.Thread.Sleep(100);
            }

            Debug.Log($"Sunucu yaniti: {request.downloadHandler.text}");
            Debug.Log($"Response code: {request.responseCode}");

            if (request.result == UnityWebRequest.Result.Success)
            {
                try
                {
                    CodeResponse response = JsonUtility.FromJson<CodeResponse>(request.downloadHandler.text);
                    Debug.Log($"Response success: {response.success}");
                    Debug.Log($"Response message: {response.message}");

                    if (response.success)
                    {
                        isCodeVerified = true;
                        sendResultButton.interactable = true;

                        // Section array'ini string array'e çevir
                        string[] sectionNames = new string[response.sections.Length];
                        for (int i = 0; i < response.sections.Length; i++)
                        {
                            sectionNames[i] = response.sections[i].name;
                        }

                        UpdateStatus($"Kod dogrulandi! Açılan bölümler: {string.Join(", ", sectionNames)}");
                        return sectionNames;
                    }
                    else
                    {
                        UpdateStatus($"Gecersiz kod: {response.message}");
                        return null;
                    }
                }
                catch (Exception e)
                {
                    Debug.LogError($"JSON parse hatası: {e.Message}");
                    UpdateStatus($"Sunucu yanıtı işlenirken hata oluştu: {e.Message}");
                    return null;
                }
            }
            else
            {
                string errorMessage = $"Dogrulama hatasi: {request.error}\nYanit: {request.downloadHandler.text}\nResponse Code: {request.responseCode}";
                UpdateStatus(errorMessage);
                Debug.LogError(errorMessage);
                return null;
            }
        }
    }


    public string SendDataToServer(List<AnswerData> data)
    {
        if (!isCodeVerified)
        {
            UpdateStatus("Once kodu dogrulamanız gerekiyor!");
            return "Once kodu dogrulamanız gerekiyor!";
        }

        if (data.Count == 0)
        {
            UpdateStatus("Gonderilecek cevap bulunamadi!");
            return "Gonderilecek cevap bulunamadi!";
        }

        GameResult gameResult = new GameResult
        {
            playerCode = gameCode,
            section = "1",
            answers = data
        };

        string jsonData = JsonUtility.ToJson(gameResult, true);
        Debug.Log("Gonderilen veri: " + jsonData);

        // JSON verisini byte array'e çevir
        byte[] bodyRaw = System.Text.Encoding.UTF8.GetBytes(jsonData);

        using (UnityWebRequest request = UnityWebRequest.PostWwwForm($"{SERVER_URL}/api/register-result", ""))
        {
            // Content-Type header'ını ayarla
            request.SetRequestHeader("Content-Type", "application/json");

            // JSON verisini request body'sine ekle
            request.uploadHandler = new UploadHandlerRaw(bodyRaw);

            Debug.Log($"Request URL: {request.url}");
            Debug.Log($"Request Headers: {request.GetRequestHeader("Content-Type")}");
            Debug.Log($"Request Body Length: {bodyRaw.Length}");

            var operation = request.SendWebRequest();

            // İşlemin tamamlanmasını bekle
            while (!operation.isDone)
            {
                System.Threading.Thread.Sleep(100);
            }

            if (request.result == UnityWebRequest.Result.Success)
            {
                UpdateStatus("Sonuclar basariyla gonderildi!");
                Debug.Log("Sunucu yaniti: " + request.downloadHandler.text);
                ResetUI();
                return "Sonuclar basariyla gonderildi!";
            }
            else
            {
                string errorMessage = $"Gonderim hatasi: {request.error}\nYanit: {request.downloadHandler.text}";
                UpdateStatus(errorMessage);
                Debug.LogError($"Sunucu hatasi: {request.error}\nYanit: {request.downloadHandler.text}");
                return errorMessage;
            }
        }
    }

    private void ResetUI()
    {
        isCodeVerified = false;
        gameCode = "";
        codeInputField.text = "";
        codeInputField.interactable = true;
        verifyCodeButton.interactable = true;
        sendResultButton.interactable = false;
        playerAnswers.Clear();
        UpdateStatus("Yeni bir kod girebilirsiniz.");
    }

    private void UpdateStatus(string message)
    {
        if (statusText != null)
            statusText.text = message;
        Debug.Log(message);
    }
}

