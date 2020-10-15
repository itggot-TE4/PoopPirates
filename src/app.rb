class Application < Sinatra::Base

    before do
        headers 'Access-Control-Allow-Origin' => '*',
                'Access-Control-Allow-Methods' => ['OPTIONS', 'GET', 'POST']
    end

    get '/?' do
        slim :index
    end

    get '/api/get/repos/:input' do
        auth = {
            username: 'te4-jonathan-ronsten',
            authorization: 'dc999fc3243646e68dad87842d5edb5c182a0a5a'
        }
        option = {basic_auth: auth}

        result = HTTParty.get("https://api.github.com/users/#{params['input']}/repos", option).body
        return result.to_json
    end
end