require "base64"

class Application < Sinatra::Base

    before do
        headers 'Access-Control-Allow-Origin' => '*',
                'Access-Control-Allow-Methods' => ['OPTIONS', 'GET', 'POST']
    end

    get '/?' do
        slim :index
    end

    get '/api/send/request/?' do
        auth = {
            username: 'te4-jonathan-ronsten',
            authorization: 'dc999fc3243646e68dad87842d5edb5c182a0a5a'
        }
        option = {basic_auth: auth}
        result = HTTParty.get(params['url'], option).body
        p result
        return result.to_json
    end

    get '/test' do
        p Base64.decode64("ZnVuY3Rpb24gc21hbGwoKXsNCiAgcmV0dXJuICJ0am8iOw0KfQ0K\n")
    end
end