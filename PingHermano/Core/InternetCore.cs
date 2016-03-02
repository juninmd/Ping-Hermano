using PingHermano.Utilidades;

namespace PingHermano.Core
{
    public class InternetCore
    {
        public RequestMessage<string> Ping()
        {

            var requestMessage = new JavaRequestWebService()
            {
                ServerUri = "https://www.google.com.br/?gfe_rd=cr&ei=lfTWVvuqDbPL8gfk2ZugDA&gws_rd=ssl"
            };
           return requestMessage.PingRequisition();
        }                                        
    }
}
