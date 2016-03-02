using Newtonsoft.Json;
using RestSharp;
using System;
using System.IO;
using System.Net;
using System.Text;

namespace PingHermano.Utilidades
{
    /// <summary>
    ///  Classe responsável pelos requests no OEBS
    /// </summary>
    public class JavaRequestWebService
    {
        public string ServerUri { get; set; }



        public RequestMessage<string> PingRequisition()
        {
            var resposta = new RequestMessage<string>
            {
                MethodApi = "GET",
            };

            try
            {
                //Cria cliente Rest
                var client = new RestClient(ServerUri) { Timeout = 222222 };
                resposta.UrlApi = client.BaseUrl.AbsoluteUri;

                //Determina o tipo de requisição que será feito
                var request = new RestRequest("GET");

                //Executa requisição na API
                var result = (RestResponse)client.Execute(request);

                resposta.StatusCode = result.StatusCode;

                // Caso o server esteja offline
                if (resposta.StatusCode == 0)
                {
                    resposta.StatusCode = HttpStatusCode.InternalServerError;
                    resposta.TechnicalMessage = result.ErrorMessage;
                    resposta.Message = $"Estamos sem internet";
                    return resposta;
                }
              
                try
                {
                    resposta.Content = result.Content;
                    resposta.Message = "Temos Internet";
                }
                catch (Exception ex)
                {
                    resposta.Message = "O conteúdo não condiz com o esperado";
                    resposta.TechnicalMessage = ex.Message;
                }

                return resposta;
            }
            catch (Exception ex) when (ex.Message == "URI inválido: não foi possível determinar o formato do URI." ||
                                       ex.Message == "Invalid URI: The format of the URI could not be determined.")
            {
                resposta.TechnicalMessage = ex.Message;
                resposta.UrlApi = ServerUri;
                resposta.Message = $"A URI informada é inválida ou você não possui conexão com a internet, por favor verifique!\nURI: {resposta.UrlApi}";
                resposta.StatusCode = HttpStatusCode.InternalServerError;
                return resposta;
            }
            catch (Exception ex)
            {
                resposta.TechnicalMessage = ex.Message;
                resposta.UrlApi = ServerUri;
                resposta.Message = $"Falha na requisição {ex.Message}";
                resposta.StatusCode = HttpStatusCode.InternalServerError;
                return resposta;
            }
        }

        public RequestMessage<T> RouteRequisition<T>(string query, string uriMethod = "", Method typeMethod = Method.GET)
        {
            var resposta = new RequestMessage<T>
            {
                MethodApi = uriMethod,
            };

            try
            {
                //Cria cliente Rest
                var client = new RestClient(ServerUri + query) { Timeout = 222222 };
                resposta.UrlApi = client.BaseUrl.AbsoluteUri;

                //Determina o tipo de requisição que será feito
                var request = new RestRequest(typeMethod);

                //Executa requisição na API
                var result = (RestResponse)client.Execute(request);

                return ValidacoesRequest(result, resposta);
            }
            catch (Exception ex) when (ex.Message == "URI inválido: não foi possível determinar o formato do URI." ||
                                       ex.Message == "Invalid URI: The format of the URI could not be determined.")
            {
                resposta.TechnicalMessage = ex.Message;
                resposta.UrlApi = ServerUri + query;
                resposta.Message = $"A URI informada é inválida ou você não possui conexão com a internet, por favor verifique!\nURI: {resposta.UrlApi}";
                resposta.StatusCode = HttpStatusCode.InternalServerError;
                return resposta;
            }
            catch (Exception ex)
            {
                resposta.TechnicalMessage = ex.Message;
                resposta.UrlApi = ServerUri + query;
                resposta.Message = $"Falha na requisição OEBS: {ex.Message}";
                resposta.StatusCode = HttpStatusCode.InternalServerError;
                return resposta;
            }
        }
        /// <summary>
        /// Validações Request
        /// </summary>
        /// <typeparam name="T"></typeparam>
        /// <param name="result"></param>
        /// <param name="resposta"></param>
        /// <returns></returns>
        protected RequestMessage<T> ValidacoesRequest<T>(RestResponse result, RequestMessage<T> resposta)
        {
            //Avalia retorno da chamada
            resposta.StatusCode = result.StatusCode;

            // Caso o server esteja offline
            if (resposta.StatusCode == 0)
            {
                resposta.StatusCode = HttpStatusCode.InternalServerError;
                resposta.TechnicalMessage = result.ErrorMessage;
                resposta.Message = $"Verifique se a api está ativada. Não foi possível conectar com o OEBS. \n{resposta.UrlApi}";
                return resposta;
            }

            if (resposta.StatusCode == HttpStatusCode.ServiceUnavailable)
            {
                resposta.StatusCode = HttpStatusCode.InternalServerError;
                resposta.TechnicalMessage = result.ErrorMessage;
                resposta.Message = $"Verifique se a api está disponível. Não foi possível conectar com o OEBS. \n{resposta.UrlApi}";
                return resposta;
            }

            if (result.StatusCode == HttpStatusCode.NotFound)
            {
                resposta.Message = "Não foi encontrado";
                resposta.TechnicalMessage = result.StatusDescription;
                return resposta;
            }

            if (!result.ContentType.Contains("application/json"))
            {
                resposta.StatusCode = HttpStatusCode.BadRequest;
                resposta.TechnicalMessage = result.StatusDescription + result.Content;
                resposta.Message = "Resposta inválida! \nEsperava-se um retorno em formato JSON";
                return resposta;
            }



            if (result.StatusCode != HttpStatusCode.OK && result.StatusCode != HttpStatusCode.Accepted && result.Content != null)
            {
                resposta.TechnicalMessage = result.ErrorMessage;
                resposta.Message = "Ocorreu uma falha com o WebService -" + result.ResponseUri.AbsoluteUri;

                return resposta;
            }

            //Deserializa o objeto e retorna a entidade solicitada.
            try
            {
                resposta.Content = JsonConvert.DeserializeObject<T>(result.Content, new JsonSerializerSettings
                {
                    NullValueHandling = NullValueHandling.Ignore
                });
            }
            catch (Exception ex)
            {
                resposta.Message = "O conteúdo não condiz com o esperado";
                resposta.TechnicalMessage = ex.Message;
            }

            return resposta;
        }
    }

    public class JavaRequestWebService<R> : JavaRequestWebService
    {
        public RequestMessage<R> BodyRequisition<T>(T entidade, string query, string uriMethod = "", Method typeMethod = Method.GET)
        {
            var resposta = new RequestMessage<R>
            {
                UrlApi = ServerUri + query,
                MethodApi = uriMethod
            };

            try
            {
                var request = WebRequest.Create(ServerUri + query);

                var bytes = Encoding.UTF8.GetBytes(JsonConvert.SerializeObject(entidade,
                    new JsonSerializerSettings { DateTimeZoneHandling = DateTimeZoneHandling.Local }));


                request.Method = typeMethod.ToString();
                request.ContentType = "application/json;charset=utf-8";
                request.ContentLength = bytes.Length;
                request.Timeout = 9999999;

                var dataStream = request.GetRequestStream();
                dataStream.Write(bytes, 0, bytes.Length);
                dataStream.Close();

                var response = request.GetResponse();
                dataStream = response.GetResponseStream();

                if (dataStream != null)
                {
                    string responseData = new StreamReader(dataStream).ReadToEnd();
                    response.Close();
                    dataStream.Close();

                    resposta.Content = JsonConvert.DeserializeObject<R>(responseData);
                    resposta.StatusCode = HttpStatusCode.OK;
                    return resposta;
                }
                response.Close();
                resposta.StatusCode = HttpStatusCode.NotFound;
                return resposta;
            }
            catch (Exception ex)
            {
                resposta.Message = "Erro na chamada da API" + ServerUri + query + ": " + ex.Message;
                resposta.StatusCode = HttpStatusCode.InternalServerError;
            }
            return resposta;
        }
    }
}