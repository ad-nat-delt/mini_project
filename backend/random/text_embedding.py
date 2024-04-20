import torch
import torch.nn.functional as F
from transformers import AutoTokenizer, AutoModel
from summ_api.summ1 import summary
from transcription.transcibe import transcribe
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

# summary()
# transcribe()

txt = open("./summ_api/summary.txt","r").read()
print(txt)

transcribe_text = open("./transcription/a.txt","r").read()
print(transcribe_text)

embed_text = open("events.txt","r").read()

trans_li = transcribe_text.split("\n")
events_li = embed_text.split("\n")

model_ckpt = "sentence-transformers/all-MiniLM-L6-v2"
tokenizer = AutoTokenizer.from_pretrained(model_ckpt)
model = AutoModel.from_pretrained(model_ckpt)

def get_embeddings(textval):
    encoded_input = tokenizer(textval,padding=True, truncation=True, return_tensors='pt')

    with torch.no_grad():
        model_output = model(**encoded_input)

    token_embeddings = model_output.last_hidden_state
    sentence_embeddings = mean_pooling(token_embeddings, encoded_input['attention_mask'])
    sentence_embeddings = F.normalize(sentence_embeddings, p=2, dim=1)
    return sentence_embeddings



    # print(token_embeddings)
    # # print(token_embeddings)
    # print(token_embeddings.shape)

    # Calculate the mean of all token embeddings
def mean_pooling(model_output, attention_mask):
    token_embeddings = model_output
    input_mask_expanded = (
        attention_mask.unsqueeze(-1).expand(token_embeddings.size()).float()
        )
    return torch.sum(token_embeddings * input_mask_expanded, 1) / torch.clamp(input_mask_expanded.sum(1), min=1e-9)



transcribe_embeddings = get_embeddings(transcribe_text)
events_embeddings = get_embeddings(embed_text)
    
print(transcribe_embeddings.shape)
print(events_embeddings.shape)

transcribe_embeddings = transcribe_embeddings.detach().numpy()
events_embeddings = events_embeddings.detach().numpy()
scores = np.zeros((transcribe_embeddings.shape[0], events_embeddings.shape[0]))

for idx in range(events_embeddings.shape[0]):
    scores[:,idx] = cosine_similarity([events_embeddings[idx]],transcribe_embeddings)[0]

print(scores)

print("done")